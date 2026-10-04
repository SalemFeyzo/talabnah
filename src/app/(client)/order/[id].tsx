// src/app/(client)/order/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader, StatusBadge } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { orderService } from "@/services/order";
import type { Order, OrderItem, OrderStatus } from "@/types";

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
  "ON_THE_WAY",
  "DELIVERED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار",
  PREPARING: "قيد التحضير",
  READY: "جاهز",
  ON_THE_WAY: "في الطريق",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  PENDING: "time-outline",
  PREPARING: "restaurant-outline",
  READY: "checkmark-done-outline",
  ON_THE_WAY: "bicycle-outline",
  DELIVERED: "home-outline",
  CANCELLED: "close-circle-outline",
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await orderService.getById(id);
      if (data) {
        setOrder(data);
        setItems(data.items ?? []);
      }
    } catch (e) {
      console.error("Load order details:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (!order) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="الطلب غير موجود"
          actionLabel="رجوع"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons
            name="arrow-forward"
            size={22}
            color={Colors.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <StatusBadge status={order.status} />
            <Text style={styles.statusTitle}>
              {isCancelled ? "تم إلغاء الطلب" : "حالة الطلب"}
            </Text>
          </View>

          {!isCancelled ? (
            <View style={styles.timeline}>
              {STATUS_FLOW.map((st, idx) => {
                const done = idx <= currentIndex;
                const active = idx === currentIndex;
                return (
                  <View key={st} style={styles.step}>
                    <View style={styles.stepLineWrap}>
                      {idx > 0 ? (
                        <View
                          style={[styles.stepLine, done && styles.stepLineDone]}
                        />
                      ) : null}
                      <View
                        style={[
                          styles.stepDot,
                          done && styles.stepDotDone,
                          active && styles.stepDotActive,
                        ]}
                      >
                        <Ionicons
                          name={STATUS_ICONS[st] as any}
                          size={14}
                          color={done ? "#fff" : Colors.text.muted}
                        />
                      </View>
                    </View>
                    <Text
                      style={[styles.stepLabel, done && styles.stepLabelDone]}
                    >
                      {STATUS_LABELS[st]}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>المنتجات</Text>
        <View style={styles.itemsCard}>
          {items.map((it, idx) => (
            <View
              key={it.id}
              style={[
                styles.itemRow,
                idx < items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <View style={styles.qtyBox}>
                <Text style={styles.qtyText}>×{it.quantity}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.product_name}
                </Text>
                <Text style={styles.itemPrice}>
                  {Number(it.unit_price).toFixed(2)} ل.س / وحدة
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {(Number(it.unit_price) * it.quantity).toFixed(2)} ل.س
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>
              {(
                Number(order.total_amount) - Number(order.delivery_fee ?? 0)
              ).toFixed(2)}{" "}
              ل.س
            </Text>
            <Text style={styles.totalLabel}>المجموع الفرعي</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>
              {Number(order.delivery_fee ?? 0).toFixed(2)} ل.س
            </Text>
            <Text style={styles.totalLabel}>التوصيل</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandValue}>
              {Number(order.total_amount).toFixed(2)} ل.س
            </Text>
            <Text style={styles.grandLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes ? (
          <>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Date */}
        <Text style={styles.dateText}>
          تاريخ الطلب:{" "}
          {new Date(order.created_at).toLocaleString("ar-EG", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Text>
      </ScrollView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.default,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  statusCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  statusHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  timeline: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  step: { flex: 1, alignItems: "center" },
  stepLineWrap: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 32,
  },
  stepLine: {
    position: "absolute",
    top: 15,
    right: "50%",
    left: "-50%",
    height: 2,
    backgroundColor: Colors.border.default,
  },
  stepLineDone: { backgroundColor: Colors.primary.main },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border.default,
    zIndex: 1,
  },
  stepDotDone: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  stepDotActive: {
    backgroundColor: Colors.gold.main,
    borderColor: Colors.gold.main,
    transform: [{ scale: 1.1 }],
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  stepLabelDone: {
    color: Colors.primary.main,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  itemsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  qtyBox: {
    backgroundColor: Colors.primary.soft,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: "center",
  },
  qtyText: {
    color: Colors.primary.main,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.xs,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  itemPrice: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  itemTotal: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
  totalsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  totalValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  grandLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  grandValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold.dark,
  },
  notesCard: {
    backgroundColor: Colors.gold.soft,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold.light,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    textAlign: "right",
    lineHeight: 20,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
