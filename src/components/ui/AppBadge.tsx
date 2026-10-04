// src/components/ui/AppBadge.tsx
import { Colors, OrderStatus, OrderStatusColors } from "@/constants/colors";
import { Radius, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface AppBadgeProps {
  label: string;
  bg?: string;
  color?: string;
  style?: ViewStyle;
}

export function AppBadge({
  label,
  bg = Colors.primary.soft,
  color = Colors.primary.main,
  style,
}: AppBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: OrderStatus;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const conf = OrderStatusColors[status];
  return (
    <AppBadge label={conf.label} bg={conf.bg} color={conf.text} style={style} />
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 2,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: "center",
  },
});
