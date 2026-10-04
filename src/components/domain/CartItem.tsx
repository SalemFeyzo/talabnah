// src/components/domain/CartItem.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/colors";
import { Radius, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  const { product, quantity } = item;
  const lineTotal = Number(product.price) * quantity;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons
              name="image-outline"
              size={22}
              color={Colors.text.muted}
            />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={Colors.status.error}
            />
          </Pressable>
        </View>

        <Text style={styles.price}>{Number(product.price).toFixed(2)} ل.س</Text>

        <View style={styles.footer}>
          <View style={styles.qtyWrap}>
            <Pressable
              onPress={onDecrement}
              style={({ pressed }) => [
                styles.qtyBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="remove" size={16} color={Colors.primary.main} />
            </Pressable>

            <Text style={styles.qty}>{quantity}</Text>

            <Pressable
              onPress={onIncrement}
              style={({ pressed }) => [
                styles.qtyBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={16} color={Colors.primary.main} />
            </Pressable>
          </View>

          <Text style={styles.lineTotal}>{lineTotal.toFixed(2)} ل.س</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row-reverse",
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.gray[100],
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, justifyContent: "space-between" },
  topRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  price: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  qtyWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary.soft,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
    minWidth: 20,
    textAlign: "center",
  },
  lineTotal: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
  pressed: { opacity: 0.6 },
});
