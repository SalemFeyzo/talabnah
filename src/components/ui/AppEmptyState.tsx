// src/components/ui/AppEmptyState.tsx
import { Colors } from "@/constants/colors";
import { Spacing } from "@/constants/spacing";
import { TextPreset } from "@/constants/typography";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { AppButton } from "./AppButton";

interface AppEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function AppEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: AppEmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: Spacing.lg }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  title: {
    ...TextPreset.h4,
    color: Colors.text.primary,
    textAlign: "center",
  },
  message: {
    ...TextPreset.caption,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
});
