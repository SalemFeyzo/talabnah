// src/app/(client)/checkout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState, AppInput, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { addressService } from "@/services/address";
import { orderService } from "@/services/order";
import type { Address } from "@/types";
import { showAlert } from "@/utils/confirm";

type PaymentMethod = "cash" | "card";

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totals, merchantId, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newLabel, setNewLabel] = useState("المنزل");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const list = await addressService.listMine();
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setSelectedAddressId(def.id);
    } catch (e) {
      console.error("Load addresses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSaveAddress = async () => {
    if (!user?.id) return;
    if (!newAddressLine.trim()) {
      showAlert("تنبيه", "الرجاء إدخال العنوان");
      return;
    }
    try {
      const created = await addressService.create({
        client_id: user.id,
        label: newLabel.trim() || "المنزل",
        address_line: newAddressLine.trim(),
        details: newDetails.trim() || null,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
      setNewAddressLine("");
      setNewDetails("");
      setNewLabel("المنزل");
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر حفظ العنوان");
    }
  };

  const handleSubmit = async () => {
    if (!merchantId) {
      showAlert("تنبيه", "السلة فارغة");
      return;
    }
    if (!selectedAddressId) {
      showAlert("تنبيه", "الرجاء اختيار عنوان التوصيل");
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.create({
        merchant_id: merchantId,
        address_id: selectedAddressId,
        notes: notes.trim() || null,
        delivery_fee: totals.deliveryFee,
        items: items.map((it) => ({
          product_id: it.product.id,
          product_name: it.product.name,
          unit_price: Number(it.product.price),
          quantity: it.quantity,
        })),
      });

      clearCart();

      showAlert("🎉 تم استلام طلبك", "سيتم التواصل معك قريباً");
      router.replace(`/(client)/order/${order.id}` as any);
    } catch (e: any) {
      console.error("Submit order:", e);
      showAlert("خطأ", e?.message ?? "تعذّر إتمام الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (items.length === 0) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="السلة فارغة"
          message="أضف منتجات أولاً."
          actionLabel="تصفّح الأقسام"
          onAction={() => router.push("/(client)/categories")}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
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
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>عنوان التوصيل</Text>

        {addresses.length === 0 && !showNewAddress ? (
          <Pressable
            onPress={() => setShowNewAddress(true)}
            style={styles.addAddressBtn}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary.main}
            />
            <Text style={styles.addAddressText}>إضافة عنوان جديد</Text>
          </Pressable>
        ) : null}

        {addresses.map((a) => {
          const selected = a.id === selectedAddressId;
          return (
            <Pressable
              key={a.id}
              onPress={() => setSelectedAddressId(a.id)}
              style={[styles.addressCard, selected && styles.addressCardActive]}
            >
              <View style={styles.addressLeft}>
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={selected ? Colors.primary.main : Colors.text.muted}
                />
              </View>
              <View style={styles.addressRight}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{a.label}</Text>
                  {a.is_default ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>افتراضي</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.addressLine}>{a.address_line}</Text>
                {a.details ? (
                  <Text style={styles.addressDetails}>{a.details}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

        {addresses.length > 0 && !showNewAddress ? (
          <Pressable
            onPress={() => setShowNewAddress(true)}
            style={styles.linkBtn}
          >
            <Ionicons name="add" size={16} color={Colors.primary.main} />
            <Text style={styles.linkText}>إضافة عنوان آخر</Text>
          </Pressable>
        ) : null}

        {showNewAddress ? (
          <View style={styles.newAddressBox}>
            <AppInput
              label="اسم العنوان"
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="المنزل، العمل..."
            />
            <AppInput
              label="العنوان"
              value={newAddressLine}
              onChangeText={setNewAddressLine}
              placeholder="الحي، الشارع، رقم المبنى"
            />
            <AppInput
              label="تفاصيل إضافية (اختياري)"
              value={newDetails}
              onChangeText={setNewDetails}
              placeholder="الطابق، الشقة، علامة مميزة"
            />
            <View style={styles.newAddressActions}>
              <AppButton
                label="إلغاء"
                onPress={() => setShowNewAddress(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <AppButton
                label="حفظ"
                onPress={handleSaveAddress}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          طريقة الدفع
        </Text>

        <Pressable
          onPress={() => setPayment("cash")}
          style={[styles.payCard, payment === "cash" && styles.payCardActive]}
        >
          <View style={styles.payLeft}>
            <Ionicons
              name={payment === "cash" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={
                payment === "cash" ? Colors.primary.main : Colors.text.muted
              }
            />
          </View>
          <View style={styles.payRight}>
            <Ionicons
              name="cash-outline"
              size={22}
              color={Colors.primary.main}
            />
            <View style={{ marginRight: Spacing.md }}>
              <Text style={styles.payTitle}>الدفع عند الاستلام</Text>
              <Text style={styles.paySub}>ادفع نقداً عند تسليم الطلب</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setPayment("card")}
          style={[styles.payCard, payment === "card" && styles.payCardActive]}
        >
          <View style={styles.payLeft}>
            <Ionicons
              name={payment === "card" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={
                payment === "card" ? Colors.primary.main : Colors.text.muted
              }
            />
          </View>
          <View style={styles.payRight}>
            <Ionicons
              name="card-outline"
              size={22}
              color={Colors.primary.main}
            />
            <View style={{ marginRight: Spacing.md }}>
              <Text style={styles.payTitle}>بطاقة بنكية</Text>
              <Text style={styles.paySub}>قريباً</Text>
            </View>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          ملاحظات إضافية
        </Text>
        <AppInput
          value={notes}
          onChangeText={setNotes}
          placeholder="مثال: الرجاء عدم استخدام البهارات الحارة"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, paddingTop: 12 }}
        />
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>
            {totals.subtotal.toFixed(2)} ل.س
          </Text>
          <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>
            {totals.deliveryFee.toFixed(2)} ل.س
          </Text>
          <Text style={styles.summaryLabel}>التوصيل</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalValue}>{totals.total.toFixed(2)} ل.س</Text>
          <Text style={styles.totalLabel}>الإجمالي</Text>
        </View>

        <AppButton
          label={submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !selectedAddressId}
          variant="primary"
          fullWidth
          style={{ marginTop: Spacing.md }}
        />
      </View>
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.md,
  },
  addAddressBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary.main,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.primary.soft,
  },
  addAddressText: {
    color: Colors.primary.main,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  addressCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.paper,
    marginBottom: Spacing.sm,
  },
  addressCardActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.soft,
  },
  addressLeft: { paddingTop: 2 },
  addressRight: { flex: 1 },
  addressHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: Colors.gold.main,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  defaultText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: FontWeight.bold,
  },
  addressLine: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: "right",
    marginTop: 2,
  },
  addressDetails: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  linkBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: Spacing.sm,
  },
  linkText: {
    color: Colors.primary.main,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  newAddressBox: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  newAddressActions: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
  },
  payCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.paper,
    marginBottom: Spacing.sm,
  },
  payCardActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.soft,
  },
  payLeft: { paddingTop: 2 },
  payRight: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  payTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  paySub: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  bottom: {
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
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold.dark,
  },
});
