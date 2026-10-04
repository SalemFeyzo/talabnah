// src/app/(client)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryCard, ProductCard, StoreCard } from "@/components/domain";
import { ResponsiveGrid, ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { merchantService } from "@/services/merchant";
import { productService } from "@/services/product";
import type { Category, Merchant, Product } from "@/types";

export default function ClientHome() {
  const router = useRouter();
  const { profile } = useAuth();
  const { addItem, itemCount } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cats, strs, prods] = await Promise.all([
        productService.listCategories(),
        merchantService.listActive(),
        productService.listPopular(20),
      ]);
      setCategories(cats);
      setStores(strs);
      setProducts(prods);
    } catch (e) {
      console.error("Home load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAdd = (product: Product) => {
    if (!product.merchant_id) return;
    const store = stores.find((s) => s.id === product.merchant_id);
    addItem(product, product.merchant_id, store?.store_name ?? "متجر");
    router.push("/(client)/cart");
  };

  if (loading) {
    return <AppLoader message="جاري التحميل..." />;
  }

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.push("/(client)/cart")}
            style={styles.iconBtn}
          >
            <Ionicons
              name="cart-outline"
              size={22}
              color={Colors.primary.main}
            />
            {itemCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.primary.main}
            />
          </Pressable>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.hi}>مرحباً،</Text>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.full_name || "زائر"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Search */}
          <Pressable
            onPress={() => router.push("/(client)/categories")}
            style={styles.searchBar}
          >
            <Ionicons name="search" size={18} color={Colors.text.muted} />
            <Text style={styles.searchText}>ابحث عن منتج أو متجر...</Text>
          </Pressable>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>أجود المنتجات</Text>
              <Text style={styles.heroSub}>من مزارعنا مباشرة</Text>
              <Pressable
                onPress={() => router.push("/(client)/categories")}
                style={styles.heroBtn}
              >
                <Text style={styles.heroBtnText}>تسوّق الآن</Text>
              </Pressable>
            </View>
            <Ionicons
              name="basket"
              size={80}
              color={Colors.gold.main}
              style={{ opacity: 0.35 }}
            />
          </View>

          {/* Categories */}
          {categories.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>الأقسام</Text>
                <Pressable onPress={() => router.push("/(client)/categories")}>
                  <Text style={styles.seeAll}>عرض الكل</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: "row-reverse",
                  gap: 12,
                }}
              >
                {categories.map((c) => (
                  <CategoryCard
                    key={c.id}
                    category={c}
                    onPress={() =>
                      router.push(`/(client)/category/${c.id}` as any)
                    }
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Stores */}
          {stores.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>متاجر قريبة</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: "row-reverse",
                  gap: 12,
                }}
              >
                {stores.map((s) => (
                  <View key={s.id} style={{ width: 240 }}>
                    <StoreCard
                      store={s}
                      onPress={() =>
                        router.push(`/(client)/store/${s.id}` as any)
                      }
                    />
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Products */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>منتجات مميزة</Text>
          </View>

          {products.length === 0 ? (
            <AppEmptyState
              title="لا توجد منتجات بعد"
              message="ستظهر المنتجات هنا عند إضافتها من التجار."
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
                  onPress={() =>
                    router.push(`/(client)/product/${it.id}` as any)
                  }
                  onAdd={() => handleAdd(it)}
                />
              )}
            />
          )}
        </View>
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
  headerLeft: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: Colors.gold.main,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  greeting: { alignItems: "flex-end", flex: 1 },
  hi: { fontSize: FontSize.xs, color: Colors.text.muted },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  content: { padding: Spacing.lg },
  searchBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchText: {
    color: Colors.text.muted,
    fontSize: FontSize.sm,
    flex: 1,
    textAlign: "right",
  },
  hero: {
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  heroTitle: {
    color: "#fff",
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: "right",
  },
  heroSub: {
    color: Colors.primary.soft,
    fontSize: FontSize.sm,
    marginTop: 2,
    textAlign: "right",
  },
  heroBtn: {
    backgroundColor: Colors.gold.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignSelf: "flex-end",
    marginTop: Spacing.md,
  },
  heroBtnText: {
    color: Colors.primary.dark,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary.main,
    fontWeight: FontWeight.semibold,
  },
});
