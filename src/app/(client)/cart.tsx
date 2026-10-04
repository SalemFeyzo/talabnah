// src/app/(client)/cart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CartItem } from "@/components/domain";
import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useCart } from "@/context/CartContext";

export default function CartScreen() {
  const router = useRouter();
  const { items, totals, merchantName, updateQuantity, removeItem, clearCart } =
    useCart();

  const handleClear = () => {
    Alert.alert("تفريغ السلة", "هل تريد حذف كل المنتجات؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <ScreenContainer edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>السلة</Text>
        </View>
        <AppEmptyState
          title="سلتك فارغة"
          message="ابدأ بإضافة منتجات من الأقسام أو المتاجر."
          actionLabel="تصفّح الأقسام"
          onAction={() => router.push("/(client)/categories")}
          icon={
            <Ionicons name="cart-outline" size={64} color={Colors.text.muted} />
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClear} hitSlop={8}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={Colors.status.error}
          />
        </Pressable>
        <Text style={styles.title}>السلة</Text>
        <Text style={styles.count}>({totals.itemCount})</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {merchantName ? (
          <View style={styles.storeBanner}>
            <Ionicons
              name="storefront-outline"
              size={16}
              color={Colors.primary.main}
            />
            <Text style={styles.storeText}>من: {merchantName}</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncrement={() =>
              updateQuantity(item.product.id, item.quantity + 1)
            }
            onDecrement={() =>
              updateQuantity(item.product.id, item.quantity - 1)
            }
            onRemove={() => removeItem(item.product.id)}
          />
        ))}
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.summary}>
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
          label="إتمام الطلب"
          onPress={() => router.push("/(client)/checkout")}
          variant="primary"
          fullWidth
          icon={<Ionicons name="arrow-back" size={18} color="#fff" />}
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
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  count: {
    fontSize: FontSize.md,
    color: Colors.text.muted,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  storeBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary.soft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  storeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.main,
  },
  summary: {
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
    marginBottom: Spacing.sm,
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
