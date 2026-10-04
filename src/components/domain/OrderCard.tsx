// src/components/domain/OrderCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { Order } from "@/types";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.orderNumWrap}>
          <Ionicons
            name="receipt-outline"
            size={16}
            color={Colors.primary.main}
          />
          <Text style={styles.orderNum}>
            #{order.id.slice(0, 6).toUpperCase()}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.dateWrap}>
          <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.total}>
            {Number(order.total_amount).toFixed(2)} ل.س
          </Text>
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
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNumWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderNum: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  footer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  totalWrap: { alignItems: "flex-start" },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
    textAlign: "right",
  },
});
