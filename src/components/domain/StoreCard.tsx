// src/components/domain/StoreCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { Merchant } from "@/types";

interface StoreCardProps {
  store: Merchant;
  onPress?: () => void;
  variant?: "vertical" | "horizontal";
}

export function StoreCard({
  store,
  onPress,
  variant = "horizontal",
}: StoreCardProps) {
  const isVertical = variant === "vertical";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isVertical ? styles.vertical : styles.horizontal,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.logoWrap, isVertical && styles.logoWrapVertical]}>
        {store.logo_url ? (
          <Image
            source={{ uri: store.logo_url }}
            style={styles.logo}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="storefront" size={28} color={Colors.gold.main} />
        )}
      </View>

      <View style={[styles.body, isVertical && styles.bodyVertical]}>
        <Text style={styles.name} numberOfLines={1}>
          {store.store_name}
        </Text>

        {store.address ? (
          <View style={styles.row}>
            <Ionicons
              name="location-outline"
              size={12}
              color={Colors.text.muted}
            />
            <Text style={styles.muted} numberOfLines={1}>
              {store.address}
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Ionicons name="star" size={12} color={Colors.gold.main} />
          <Text style={styles.rating}>4.8</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.muted}>مفتوح</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  horizontal: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  vertical: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  pressed: { opacity: 0.9 },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoWrapVertical: { marginBottom: Spacing.sm },
  logo: { width: "100%", height: "100%" },
  body: { flex: 1, alignItems: "flex-start" },
  bodyVertical: { alignItems: "center" },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rating: {
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    fontWeight: FontWeight.semibold,
  },
  muted: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  dot: { fontSize: FontSize.xs, color: Colors.text.muted },
});
