// src/app/(driver)/order/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
import { useAuth } from "@/context/AuthContext";
import { driverService } from "@/services/driver";
import { showAlert, showConfirm } from "@/utils/confirm";

export default function DriverOrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await driverService.getOrderDetails(id);
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

  const handleAccept = () => {
    if (!user?.id || !order) return;
    showConfirm("قبول الطلب", "هل تريد قبول هذا الطلب؟", async () => {
      setUpdating(true);
      try {
        const updated = await driverService.acceptOrder(order.id, user.id);
        setOrder((prev: any) => ({ ...prev, ...updated }));
        setUpdating(false);
        setTimeout(() => {
          showAlert("✅", "تم قبول الطلب. توجه للعميل الآن.");
        }, 100);
      } catch (e: any) {
        setUpdating(false);
        setTimeout(() => {
          showAlert("خطأ", e?.message ?? "تعذّر قبول الطلب");
        }, 100);
      }
    });
  };

  const handleDelivered = () => {
    if (!order) return;
    showConfirm("تأكيد التسليم", "هل تم تسليم الطلب للعميل؟", async () => {
      setUpdating(true);
      try {
        const updated = await driverService.updateOrderStatus(
          order.id,
          "DELIVERED",
        );
        setOrder((prev: any) => ({ ...prev, ...updated }));
        setUpdating(false);
        setTimeout(() => {
          showAlert("🎉", "تم التسليم بنجاح");
          router.replace("/(driver)");
        }, 100);
      } catch (e: any) {
        setUpdating(false);
        setTimeout(() => {
          showAlert("خطأ", e?.message ?? "تعذّر تأكيد التسليم");
        }, 100);
      }
    });
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      showAlert("خطأ", "تعذّر فتح الاتصال"),
    );
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

  const isAvailable = order.status === "READY" && !order.driver_id;
  const isMyActive =
    order.driver_id === user?.id && order.status === "ON_THE_WAY";

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
        </View>

        {/* Client */}
        {order.client ? (
          <>
            <Text style={styles.sectionTitle}>العميل</Text>
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
                <Pressable
                  style={styles.callBtn}
                  onPress={() => handleCall(order.client.phone)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        {/* Merchant */}
        {order.merchant ? (
          <>
            <Text style={styles.sectionTitle}>المتجر</Text>
            <View style={styles.card}>
              <View style={styles.clientRow}>
                <View style={styles.storeAvatar}>
                  <Ionicons
                    name="storefront"
                    size={20}
                    color={Colors.gold.dark}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>
                    {order.merchant.store_name}
                  </Text>
                  {order.merchant.address ? (
                    <Text style={styles.clientPhone}>
                      {order.merchant.address}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* Items */}
        {order.items && order.items.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>المنتجات</Text>
            <View style={styles.card}>
              {order.items.map((it: any, idx: number) => (
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
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.product_name}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Totals */}
        <Text style={styles.sectionTitle}>الفاتورة</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>
              {Number(order.total_amount).toFixed(2)} ل.س
            </Text>
            <Text style={styles.totalLabel}>إجمالي الطلب</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandValue}>
              {Number(order.delivery_fee ?? 0).toFixed(2)} ل.س
            </Text>
            <Text style={styles.grandLabel}>أجرة التوصيل</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      {isAvailable || isMyActive ? (
        <View style={styles.actions}>
          {isAvailable ? (
            <AppButton
              label="قبول الطلب"
              onPress={handleAccept}
              loading={updating}
              disabled={updating}
              variant="primary"
              fullWidth
            />
          ) : null}
          {isMyActive ? (
            <AppButton
              label="تأكيد التسليم"
              onPress={handleDelivered}
              loading={updating}
              disabled={updating}
              variant="primary"
              fullWidth
            />
          ) : null}
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
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold.soft,
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
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "right",
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
