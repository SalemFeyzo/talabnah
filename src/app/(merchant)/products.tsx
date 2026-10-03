import { useAuth } from "@/context/AuthContext";
import { merchantService, Product } from "@/services/merchant";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function ProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    if (!user) return;
    try {
      const merchant = await merchantService.getMyMerchant(user.id);
      if (merchant) {
        const data = await merchantService.getProducts(merchant.id);
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const toggleAvailability = async (
    productId: string,
    currentStatus: boolean,
  ) => {
    try {
      await merchantService.toggleProductAvailability(
        productId,
        !currentStatus,
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_available: !currentStatus } : p,
        ),
      );
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price} ل.س</Text>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {item.is_available ? "متاح" : "غير متاح"}
              </Text>
              <Switch
                value={item.is_available}
                onValueChange={() =>
                  toggleAvailability(item.id, item.is_available)
                }
                trackColor={{ false: "#cbd5e1", true: "#bae6fd" }}
                thumbColor={item.is_available ? "#0284c7" : "#94a3b8"}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد منتجات مضافة حتى الآن.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  productCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  productInfo: { flex: 1, alignItems: "flex-start" },
  productName: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  productPrice: {
    fontSize: 14,
    color: "#0284c7",
    marginTop: 4,
    fontWeight: "600",
  },
  switchContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 12, color: "#64748b" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 14 },
});
