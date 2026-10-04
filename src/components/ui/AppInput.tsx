// src/components/ui/AppInput.tsx
import { Colors } from "@/constants/colors";
import { Radius, Spacing } from "@/constants/spacing";
import { FontSize } from "@/constants/typography";
import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    { label, error, hint, leftIcon, rightIcon, containerStyle, style, ...rest },
    ref,
  ) => {
    return (
      <View style={[styles.wrap, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}

        <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}

          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={Colors.text.muted}
            textAlign="right"
            {...rest}
          />

          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

AppInput.displayName = "AppInput";

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputWrapError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  icon: {
    paddingHorizontal: Spacing.xs,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.status.error,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
});
