// src/app/(driver)/my-orders.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader, StatusBadge } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { driverService } from "@/services/driver";
import type { Order } from "@/types";

type Filter = "ALL" | "ACTIVE" | "DELIVERED";

export default function MyOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const list = await driverService.listMyOrders(user.id);
      setOrders(list);
    } catch (e) {
      console.error("Load my orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;

    let unsub: (() => void) | null = null;
    let mounted = true;

    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = driverService.subscribeMyOrders(user.id, load);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      unsub?.();
    };
  }, [user?.id, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    if (filter === "ACTIVE")
      return orders.filter((o) => o.status === "ON_THE_WAY");
    return orders.filter((o) => o.status === "DELIVERED");
  }, [orders, filter]);

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <Text style={styles.headerCount}>{orders.length} طلب</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {[
            { key: "ALL" as Filter, label: "الكل" },
            { key: "ACTIVE" as Filter, label: "الجارية" },
            { key: "DELIVERED" as Filter, label: "المكتملة" },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(driver)/order/${item.id}` as any)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.orderNumWrap}>
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={Colors.primary.main}
                />
                <Text style={styles.orderNum}>
                  #{item.id.slice(0, 6).toUpperCase()}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.text.muted}
                />
                <Text style={styles.muted}>
                  {new Date(item.created_at).toLocaleString("ar-EG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.totalWrap}>
                <Text style={styles.totalLabel}>أجرة التوصيل</Text>
                <Text style={styles.totalValue}>
                  {Number(item.delivery_fee ?? 0).toFixed(2)} ل.س
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد طلبات"
            message={
              filter === "ALL"
                ? "لم تقبل أي طلب بعد."
                : "لا توجد طلبات في هذه الفئة."
            }
            icon={
              <Ionicons
                name="bicycle-outline"
                size={64}
                color={Colors.text.muted}
              />
            }
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  headerCount: { fontSize: FontSize.sm, color: Colors.text.muted },
  filtersWrap: {
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    flexDirection: "row-reverse",
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  chipActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  chipTextActive: { color: "#fff" },
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9 },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNumWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  muted: { fontSize: FontSize.xs, color: Colors.text.muted },
  totalWrap: { alignItems: "flex-start" },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
});
