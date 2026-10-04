// src/components/ui/AppCard.tsx
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  style?: ViewStyle;
}

export function AppCard({
  children,
  onPress,
  padded = true,
  elevated = true,
  bordered = true,
  style,
}: AppCardProps) {
  const cardStyle: ViewStyle = {
    ...styles.base,
    ...(padded && styles.padded),
    ...(elevated && Shadow.sm),
    ...(bordered && styles.bordered),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  padded: {
    padding: Spacing.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  pressed: {
    opacity: 0.9,
  },
});
