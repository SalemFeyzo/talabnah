// src/app/(client)/categories.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CategoryCard } from "@/components/domain";
import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { productService } from "@/services/product";
import type { Category } from "@/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const cats = await productService.listCategories();
      setCategories(cats);
    } catch (e) {
      console.error("Categories load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>الأقسام</Text>
        <Text style={styles.subtitle}>تصفّح حسب القسم</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 ? (
          <AppEmptyState
            title="لا توجد أقسام"
            message="سيتم إضافة الأقسام قريباً."
            icon={
              <Ionicons
                name="grid-outline"
                size={48}
                color={Colors.text.muted}
              />
            }
          />
        ) : (
          <View style={styles.grid}>
            {categories.map((c) => (
              <View key={c.id} style={styles.gridItem}>
                <CategoryCard
                  category={c}
                  size={90}
                  onPress={() =>
                    router.push(`/(client)/category/${c.id}` as any)
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  gridItem: {
    width: "31%",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
});
