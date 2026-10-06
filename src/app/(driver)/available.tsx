// src/app/(driver)/available.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { driverService } from "@/services/driver";
import type { Order } from "@/types";

export default function AvailableOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await driverService.listAvailableOrders();
      setOrders(list);
    } catch (e) {
      console.error("Load available orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = driverService.subscribeAvailableOrders(load);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      unsub?.();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات المتاحة</Text>
        <Text style={styles.headerCount}>{orders.length} طلب</Text>
      </View>

      <FlatList
        data={orders}
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
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>جاهز</Text>
              </View>
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

            <Pressable
              onPress={() => router.push(`/(driver)/order/${item.id}` as any)}
              style={styles.acceptBtn}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.acceptBtnText}>عرض وتفاصيل الطلب</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد طلبات متاحة"
            message="سيتم إشعارك عند توفّر طلبات جديدة."
            icon={
              <Ionicons
                name="hourglass-outline"
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
  readyBadge: {
    backgroundColor: Colors.status.successSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  readyBadgeText: {
    color: Colors.status.success,
    fontSize: 10,
    fontWeight: FontWeight.bold,
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
    marginBottom: Spacing.md,
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
  acceptBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.main,
  },
  acceptBtnText: {
    color: "#fff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
