import { useAuth } from "@/context/AuthContext";
import { Merchant, merchantService } from "@/services/merchant";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MerchantDashboard() {
  const { user, profile } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMerchantData = async () => {
    if (!user) return;
    try {
      const data = await merchantService.getMyMerchant(user.id);
      setMerchant(data);
    } catch (error) {
      console.error("Error loading merchant:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMerchantData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // إذا لم يكن التاجر قد أنشأ متجراً بعد
  if (!merchant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noStoreTitle}>لم تقم بإنشاء متجر بعد</Text>
        <Text style={styles.noStoreSubtitle}>
          ابدأ بإضافة بيانات متجرك لبدء استقبال الطلبات وعرض منتجاتك.
        </Text>

        <Link href="/(merchant)/setup-store" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.buttonText}>إنشاء متجر جديد الآن</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* بطاقة معلومات المتجر */}
      <View style={styles.headerCard}>
        <Text style={styles.storeName}>{merchant.store_name}</Text>
        <Text style={styles.storeStatus}>
          حالة المتجر:{" "}
          {merchant.is_active ? "🟢 نشط ويستقبل الطلبات" : "🔴 مغلق مؤقتاً"}
        </Text>
      </View>

      {/* بطاقات الإحصائيات السريعة */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>طلبات اليوم</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>0 ل.س</Text>
          <Text style={styles.statLabel}>إجمالي المبيعات</Text>
        </View>
      </View>

      {/* أختصارات الإدارة */}
      <Text style={styles.sectionTitle}>إدارة متقادمة</Text>
      <View style={styles.actionsContainer}>
        <Link href="/(merchant)/products" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>📦 قائمة المنتجات والأسعار</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(merchant)/orders" asChild>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>🛍️ إدارة الطلبات الواردة</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  headerCard: {
    backgroundColor: "#0284c7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  storeStatus: { fontSize: 14, color: "#e0f2fe" },
  statsGrid: { flexDirection: "row-reverse", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, color: "#64748b" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  actionsContainer: { gap: 10 },
  actionCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  noStoreTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  noStoreSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
});
