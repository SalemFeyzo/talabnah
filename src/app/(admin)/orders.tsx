// src/app/(admin)/orders.tsx
import { Ionicons } from "@expo/vector-icons";
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
import { adminService } from "@/services/admin";
import type { Order, OrderStatus } from "@/types";

type Filter = "ALL" | OrderStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "الكل" },
  { key: "PENDING", label: "قيد الانتظار" },
  { key: "PREPARING", label: "قيد التحضير" },
  { key: "READY", label: "جاهز" },
  { key: "ON_THE_WAY", label: "في الطريق" },
  { key: "DELIVERED", label: "تم التسليم" },
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await adminService.listAllOrders();
      setOrders(list);
    } catch (e) {
      console.error("Load orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = adminService.subscribeAllOrders(load);
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

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات</Text>
        <Text style={styles.headerCount}>{orders.length}</Text>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key] ?? 0;
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
                {count > 0 ? (
                  <View
                    style={[styles.chipBadge, active && styles.chipBadgeActive]}
                  >
                    <Text
                      style={[
                        styles.chipBadgeText,
                        active && styles.chipBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                ) : null}
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
          <View style={styles.card}>
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
                <Text style={styles.totalLabel}>الإجمالي</Text>
                <Text style={styles.totalValue}>
                  {Number(item.total_amount).toFixed(2)} ل.س
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد طلبات"
            icon={
              <Ionicons
                name="receipt-outline"
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
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
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
  chipBadge: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  chipBadgeActive: { backgroundColor: Colors.gold.main },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
  },
  chipBadgeTextActive: { color: "#fff" },
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
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
