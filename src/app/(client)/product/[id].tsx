// src/app/(client)/product/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services/product";
import type { Product } from "@/types";

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await productService.getById(id);
      setProduct(p);
    } catch (e) {
      console.error("Product details error:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, product.merchant_id, "متجر");
    }
    router.push("/(client)/cart");
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (!product) {
    return (
      <ScreenContainer>
        <AppEmptyState
          title="المنتج غير موجود"
          actionLabel="رجوع"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const totalPrice = Number(product.price) * quantity;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      {/* Header */}
      <View style={styles.topBar}>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          تفاصيل المنتج
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons
                name="image-outline"
                size={64}
                color={Colors.text.muted}
              />
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.gold.main} />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.ratingMuted}>(120 تقييم)</Text>
          </View>

          <Text style={styles.price}>
            {Number(product.price).toFixed(2)} ل.س
          </Text>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {/* Quantity */}
          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>الكمية</Text>
            <View style={styles.qtyWrap}>
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.primary.main} />
              </Pressable>
              <Text style={styles.qty}>{quantity}</Text>
              <Pressable
                onPress={() => setQuantity((q) => q + 1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={18} color={Colors.primary.main} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalPrice}>{totalPrice.toFixed(2)} ل.س</Text>
        </View>
        <AppButton
          label="أضف إلى السلة"
          onPress={handleAdd}
          variant="primary"
          icon={<Ionicons name="cart" size={18} color={Colors.text.inverse} />}
          style={{ flex: 1, marginRight: Spacing.md }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
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
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1.2,
    backgroundColor: Colors.gray[100],
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  body: {
    padding: Spacing.lg,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  ratingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  rating: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  ratingMuted: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold.dark,
    textAlign: "right",
    marginTop: Spacing.md,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: "right",
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  qtySection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  qtyLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  qtyWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primary.soft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
    minWidth: 24,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    ...Shadow.md,
  },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
  },
  totalPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
    textAlign: "right",
  },
});
