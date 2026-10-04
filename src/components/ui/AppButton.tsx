// src/components/ui/AppButton.tsx
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontWeight } from "@/constants/typography";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

type Variant = "primary" | "gold" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const { container, textColor } = getVariantStyles(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              sizeTextStyles[size],
              { color: textColor },
              icon ? { marginHorizontal: Spacing.sm } : null,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function getVariantStyles(v: Variant) {
  switch (v) {
    case "primary":
      return {
        container: {
          backgroundColor: Colors.primary.main,
          ...Shadow.sm,
        } as ViewStyle,
        textColor: Colors.text.inverse,
      };
    case "gold":
      return {
        container: {
          backgroundColor: Colors.gold.main,
          ...Shadow.sm,
        } as ViewStyle,
        textColor: Colors.primary.dark,
      };
    case "outline":
      return {
        container: {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: Colors.primary.main,
        } as ViewStyle,
        textColor: Colors.primary.main,
      };
    case "ghost":
      return {
        container: {
          backgroundColor: Colors.primary.soft,
        } as ViewStyle,
        textColor: Colors.primary.main,
      };
    case "danger":
      return {
        container: {
          backgroundColor: Colors.status.errorSoft,
          borderWidth: 1,
          borderColor: Colors.status.error,
        } as ViewStyle,
        textColor: Colors.status.error,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
};

const sizeTextStyles: Record<Size, { fontSize: number }> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
};
