// src/app/(client)/category/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProductCard } from "@/components/domain";
import { ResponsiveGrid, ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services/product";
import type { Category, Product } from "@/types";

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [cat, prods] = await Promise.all([
        productService.getCategoryById(id),
        productService.listByCategory(id),
      ]);
      setCategory(cat);
      setProducts(prods);
    } catch (e) {
      console.error("Category details error:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (product: Product) => {
    addItem(product, product.merchant_id, "متجر");
    router.push("/(client)/cart");
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

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
        <Text style={styles.headerTitle}>{category?.name ?? "القسم"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <AppEmptyState
            title="لا توجد منتجات"
            message="سيتم إضافة منتجات هذا القسم قريباً."
            icon={
              <Ionicons
                name="basket-outline"
                size={48}
                color={Colors.text.muted}
              />
            }
          />
        ) : (
          <ResponsiveGrid
            data={products}
            keyExtractor={(it) => it.id}
            renderItem={(it) => (
              <ProductCard
                product={it}
                onPress={() => router.push(`/(client)/product/${it.id}` as any)}
                onAdd={() => handleAdd(it)}
              />
            )}
          />
        )}
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
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
});
