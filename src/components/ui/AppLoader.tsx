// src/components/ui/AppLoader.tsx
import { Colors } from "@/constants/colors";
import { Spacing } from "@/constants/spacing";
import { TextPreset } from "@/constants/typography";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface AppLoaderProps {
  /** نص اختياري تحت المؤشر */
  message?: string;
  /** حجم المؤشر */
  size?: "small" | "large";
  /** لون المؤشر */
  color?: string;
  /** ملء الشاشة */
  fullScreen?: boolean;
}

export function AppLoader({
  message,
  size = "large",
  color = Colors.primary.main,
  fullScreen = true,
}: AppLoaderProps) {
  return (
    <View style={[styles.container, fullScreen && styles.full]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  full: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  message: {
    ...TextPreset.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
