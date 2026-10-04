// src/app/(client)/orders.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OrderCard } from "@/components/domain";
import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { orderService } from "@/services/order";
import type { Order } from "@/types";

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await orderService.listMine();
      setOrders(list);
    } catch (e) {
      console.error("Load my orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>طلباتي</Text>
        <Text style={styles.count}>
          {orders.length > 0 ? `${orders.length} طلب` : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: 40,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <AppEmptyState
            title="لا توجد طلبات بعد"
            message="ابدأ بالتسوق من الأقسام وستظهر طلباتك هنا."
            actionLabel="تصفّح الأقسام"
            onAction={() => router.push("/(client)/categories")}
            icon={
              <Ionicons
                name="receipt-outline"
                size={64}
                color={Colors.text.muted}
              />
            }
          />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/(client)/order/${order.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  count: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
});
