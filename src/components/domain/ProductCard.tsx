// src/components/domain/ProductCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAdd?: () => void;
}

export function ProductCard({ product, onPress, onAdd }: ProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons
              name="image-outline"
              size={32}
              color={Colors.text.muted}
            />
          </View>
        )}

        {product.is_available ? (
          <View style={styles.freshBadge}>
            <Text style={styles.freshText}>متوفر</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.footer}>
          <View style={styles.priceWrap}>
            <Text style={styles.price}>{Number(product.price).toFixed(2)}</Text>
            <Text style={styles.currency}> ل.س</Text>
          </View>

          {onAdd ? (
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9 },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.gray[100],
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  freshBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  freshText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  body: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  priceWrap: { flexDirection: "row-reverse", alignItems: "baseline" },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
  currency: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
  },
});
