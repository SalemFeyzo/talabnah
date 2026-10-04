// src/app/(merchant)/order/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout";
import {
  AppButton,
  AppEmptyState,
  AppLoader,
  StatusBadge,
} from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { orderService } from "@/services/order";
import type { OrderStatus } from "@/types";
import { showAlert, showConfirm } from "@/utils/confirm";

interface OrderDetails {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  notes: string | null;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
  client?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

const NEXT_ACTIONS: Record<
  OrderStatus,
  { label: string; next: OrderStatus; variant: "primary" | "gold" | "danger" }[]
> = {
  PENDING: [
    { label: "قبول الطلب", next: "PREPARING", variant: "primary" },
    { label: "إلغاء الطلب", next: "CANCELLED", variant: "danger" },
  ],
  PREPARING: [{ label: "جاهز للتوصيل", next: "READY", variant: "gold" }],
  READY: [{ label: "بدأ التوصيل", next: "ON_THE_WAY", variant: "primary" }],
  ON_THE_WAY: [{ label: "تم التسليم", next: "DELIVERED", variant: "primary" }],
  DELIVERED: [],
  CANCELLED: [],
};

export default function MerchantOrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await orderService.getMerchantOrderDetails(id);
      setOrder(data);
    } catch (e) {
      console.error("Load order:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdateStatus = (next: OrderStatus, label: string) => {
    const confirmMsg =
      next === "CANCELLED"
        ? "هل أنت متأكد من إلغاء الطلب؟ لا يمكن التراجع."
        : `هل تريد تنفيذ: "${label}"؟`;

    showConfirm(label, confirmMsg, async () => {
      if (!order) return;
      setUpdating(true);
      try {
        // 1. حدّث في قاعدة البيانات
        const updated = await orderService.updateStatus(order.id, next);

        // 2. ✅ حدّث الحالة محلياً فوراً (optimistic update)
        setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev));

        // 3. أوقف مؤشر التحميل
        setUpdating(false);

        // 4. ✅ أجّل التنبيه قليلاً حتى يُعيد React الرسم
        setTimeout(() => {
          showAlert("✅", "تم تحديث حالة الطلب");
        }, 100);
      } catch (e: any) {
        console.error("Update status:", e);
        setUpdating(false);
        setTimeout(() => {
          showAlert("خطأ", e?.message ?? "تعذّر تحديث الحالة");
        }, 100);
      }
    });
  };

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

  const actions = NEXT_ACTIONS[order.status] ?? [];
  const subtotal = order.total_amount - (order.delivery_fee ?? 0);

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
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <StatusBadge status={order.status} />
            <Text style={styles.statusLabel}>حالة الطلب</Text>
          </View>
          <Text style={styles.statusDate}>
            {new Date(order.created_at).toLocaleString("ar-EG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        </View>

        {/* Client */}
        {order.client ? (
          <>
            <Text style={styles.sectionTitle}>بيانات العميل</Text>
            <View style={styles.card}>
              <View style={styles.clientRow}>
                <View style={styles.clientAvatar}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={Colors.primary.main}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>
                    {order.client.full_name}
                  </Text>
                  <Text style={styles.clientPhone}>{order.client.phone}</Text>
                </View>
                <Pressable style={styles.callBtn}>
                  <Ionicons name="call" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        {/* Items */}
        <Text style={styles.sectionTitle}>المنتجات</Text>
        <View style={styles.card}>
          {order.items.map((it, idx) => (
            <View
              key={it.id}
              style={[
                styles.itemRow,
                idx < order.items.length - 1 && styles.itemRowBorder,
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
        <Text style={styles.sectionTitle}>الفاتورة</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} ل.س</Text>
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
            <Text style={styles.sectionTitle}>ملاحظات العميل</Text>
            <View style={[styles.card, styles.notesCard]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={Colors.gold.dark}
              />
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Actions */}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <AppButton
              key={a.label}
              label={a.label}
              onPress={() => handleUpdateStatus(a.next, a.label)}
              loading={updating}
              disabled={updating}
              variant={a.variant}
              fullWidth
              style={{ marginBottom: Spacing.sm }}
            />
          ))}
        </View>
      ) : null}
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
  },
  statusLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  statusDate: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  clientRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  clientName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  clientPhone: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
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
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  totalLabel: { fontSize: FontSize.sm, color: Colors.text.secondary },
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
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.gold.soft,
    borderColor: Colors.gold.light,
  },
  notesText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    textAlign: "right",
    lineHeight: 20,
  },
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    padding: Spacing.lg,
    ...Shadow.md,
  },
});
