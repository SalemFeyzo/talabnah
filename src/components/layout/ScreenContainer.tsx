// src/components/layout/ScreenContainer.tsx
import { Colors } from "@/constants/colors";
import { Layout, Spacing } from "@/constants/spacing";
import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  /** اجعل الشاشة قابلة للتمرير */
  scroll?: boolean;
  /** إظهار SafeArea */
  safe?: boolean;
  /** الحواف المطلوبة للـ SafeArea */
  edges?: Edge[];
  /** لون الخلفية */
  background?: string;
  /** padding داخلي */
  padded?: boolean;
  /** نمط إضافي */
  style?: ViewStyle;
  /** نمط المحتوى (ScrollView) */
  contentStyle?: ViewStyle;
  /** لون شريط التمرير (ويب) */
  showScrollIndicator?: boolean;
}

export function ScreenContainer({
  children,
  scroll = false,
  safe = true,
  edges = ["top"],
  background = Colors.background.default,
  padded = true,
  style,
  contentStyle,
  showScrollIndicator = false,
}: ScreenContainerProps) {
  const inner = (
    <View style={[styles.inner, padded && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={showScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={styles.scroll}>{inner}</View>
  );

  if (!safe) {
    return (
      <View style={[styles.root, { backgroundColor: background }, style]}>
        {body}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: background }, style]}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: Layout.maxContentWidth,
    alignSelf: "center",
  },
  padded: {
    paddingHorizontal: Spacing.lg,
  },
});
