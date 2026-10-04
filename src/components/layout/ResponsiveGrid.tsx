// src/components/layout/ResponsiveGrid.tsx
import { Spacing } from "@/constants/spacing";
import { useResponsive } from "@/hooks/use-responsive";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface ResponsiveGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** عدد الأعمدة المخصص (افتراضي: حسب الجهاز) */
  columns?: number;
  /** المسافة بين العناصر */
  gap?: number;
  /** مكون إضافي أعلى الشبكة */
  ListHeaderComponent?: React.ReactNode;
  /** مكون عند الفراغ */
  ListEmptyComponent?: React.ReactNode;
  /** نمط إضافي */
  style?: ViewStyle;
}

export function ResponsiveGrid<T>({
  data,
  renderItem,
  keyExtractor,
  columns,
  gap = Spacing.md,
  ListHeaderComponent,
  ListEmptyComponent,
  style,
}: ResponsiveGridProps<T>) {
  const { gridColumns } = useResponsive();
  const cols = columns ?? gridColumns;

  // عرض كل عنصر: (100% - (عدد الأعمدة - 1) * gap) / عدد الأعمدة
  const itemWidthPercent = `${100 / cols}%` as const;

  return (
    <View style={[styles.wrap, style]}>
      {ListHeaderComponent ? (
        <View style={{ width: "100%" }}>{ListHeaderComponent}</View>
      ) : null}

      {data.length === 0 && ListEmptyComponent ? (
        <View style={{ width: "100%" }}>{ListEmptyComponent}</View>
      ) : (
        <View style={[styles.grid, { marginHorizontal: -gap / 2 }]}>
          {data.map((item, index) => (
            <View
              key={keyExtractor(item, index)}
              style={{
                width: itemWidthPercent,
                paddingHorizontal: gap / 2,
                marginBottom: gap,
              }}
            >
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
  },
});
