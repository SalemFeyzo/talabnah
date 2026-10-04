// src/app/(client)/store/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { merchantService } from "@/services/merchant";
import { productService } from "@/services/product";
import type { Merchant, Product } from "@/types";

export default function StoreDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();

  const [store, setStore] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [str, prods] = await Promise.all([
        merchantService.getById(id),
        productService.listByMerchant(id),
      ]);
      setStore(str);
      setProducts(prods);
    } catch (e) {
      console.error("Store details error:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (product: Product) => {
    if (!store) return;
    addItem(product, store.id, store.store_name);
    router.push("/(client)/cart");
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (!store) {
    return (
      <ScreenContainer>
        <AppEmptyState
          title="المتجر غير موجود"
          message="ربما تم حذفه أو إيقافه."
          actionLabel="رجوع"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

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
          {store.store_name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            {store.logo_url ? (
              <Image
                source={{ uri: store.logo_url }}
                style={styles.logo}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="storefront" size={36} color={Colors.gold.main} />
            )}
          </View>

          <Text style={styles.storeName}>{store.store_name}</Text>

          {store.address ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={Colors.primary.soft}
              />
              <Text style={styles.infoText}>{store.address}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="star" size={14} color={Colors.gold.main} />
            <Text style={styles.infoText}>4.8 • مفتوح الآن</Text>
          </View>
        </View>

        {/* Products */}
        <View style={{ padding: Spacing.lg }}>
          <Text style={styles.sectionTitle}>المنتجات</Text>

          {products.length === 0 ? (
            <AppEmptyState
              title="لا توجد منتجات"
              message="لم يُضف التاجر منتجات بعد."
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
  hero: {
    backgroundColor: Colors.primary.main,
    padding: Spacing.xl,
    alignItems: "center",
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gold.main,
  },
  logo: { width: "100%", height: "100%" },
  storeName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: "#fff",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  infoText: {
    color: Colors.primary.soft,
    fontSize: FontSize.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.md,
  },
});
