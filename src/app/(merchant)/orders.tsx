// src/app/(merchant)/orders.tsx
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
import { merchantService } from "@/services/merchant";
import { orderService } from "@/services/order";
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

export default function MerchantOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const m = await merchantService.getMyMerchant(user.id);
      if (!m) {
        setMerchantId(null);
        setOrders([]);
        return;
      }
      setMerchantId(m.id);
      const list = await orderService.listByMerchant(m.id);
      setOrders(list);
    } catch (e) {
      console.error("Load orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ============ Realtime subscription ============
  useEffect(() => {
    if (!merchantId) return;

    let unsub: (() => void) | null = null;
    let mounted = true;

    // تأجيل بسيط لتفادي StrictMode double-invoke
    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = orderService.subscribeMerchantOrders(merchantId, load);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      unsub?.();
    };
  }, [merchantId, load]);

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

  if (!merchantId) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لا يوجد متجر"
          message="أنشئ متجرك أولاً لعرض الطلبات."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات</Text>
        <Text style={styles.headerCount}>{orders.length} طلب</Text>
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
          <OrderRow
            order={item}
            onPress={() => router.push(`/(merchant)/order/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد طلبات"
            message={
              filter === "ALL"
                ? "لم يستقبل متجرك أي طلب بعد."
                : "لا توجد طلبات بهذه الحالة."
            }
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

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={onPress}
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
            #{order.id.slice(0, 6).toUpperCase()}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.dateWrap}>
          <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.total}>
            {Number(order.total_amount).toFixed(2)} ل.س
          </Text>
        </View>
      </View>
    </Pressable>
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
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  date: { fontSize: FontSize.xs, color: Colors.text.muted },
  totalWrap: { alignItems: "flex-start" },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
});
