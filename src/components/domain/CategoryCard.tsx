// src/components/domain/CategoryCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
  size?: number;
}

export function CategoryCard({
  category,
  onPress,
  size = 68,
}: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {category.image_url ? (
          <Image
            source={{ uri: category.image_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Ionicons
            name="grid-outline"
            size={size * 0.4}
            color={Colors.primary.main}
          />
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: 80,
  },
  pressed: { opacity: 0.8 },
  circle: {
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.gold.soft,
  },
  image: { width: "100%", height: "100%" },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "center",
  },
});
