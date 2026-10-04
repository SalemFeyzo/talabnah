// src/app/(merchant)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useViewMode } from "@/context/ViewModeContext";
import { merchantService } from "@/services/merchant";
import { orderService } from "@/services/order";
import type { Merchant } from "@/types";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { setViewMode } = useViewMode();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const m = await merchantService.getMyMerchant(user.id);
      setMerchant(m);
      if (m) {
        const s = await orderService.getMerchantStats(m.id);
        setStats(s);
      }
    } catch (e) {
      console.error("Dashboard load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ============ Realtime subscription ============
  useEffect(() => {
    if (!merchant?.id) return;

    let unsub: (() => void) | null = null;
    let mounted = true;

    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = orderService.subscribeMerchantOrders(merchant.id, load);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      unsub?.();
    };
  }, [merchant?.id, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSwitchToClient = async () => {
    if (!user?.id) return;
    try {
      await merchantService.demoteToClient(user.id);
      await refreshProfile();
      await setViewMode("client");
      router.replace("/(client)");
    } catch (e: any) {
      console.error("Switch to client:", e);
      Alert.alert("خطأ", e?.message ?? "تعذّر التبديل");
    }
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (!merchant) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لم تنشئ متجرك بعد"
          message="أنشئ متجرك الآن وابدأ باستقبال الطلبات."
          actionLabel="إنشاء متجر جديد"
          onAction={() => router.push("/(merchant)/setup-store")}
          icon={
            <Ionicons
              name="storefront-outline"
              size={64}
              color={Colors.text.muted}
            />
          }
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.iconBtn} onPress={handleSwitchToClient}>
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={Colors.primary.main}
              />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.primary.main}
              />
            </Pressable>
          </View>
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <Text style={styles.hi}>مرحباً بك</Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {merchant.store_name}
            </Text>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>لوحة التاجر</Text>
              <Text style={styles.heroSub}>
                {merchant.is_active ? "متجرك نشط الآن" : "متجرك مغلق"}
              </Text>
            </View>
            <Ionicons
              name="trending-up"
              size={56}
              color={Colors.gold.main}
              style={{ opacity: 0.4 }}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="time-outline"
            label="طلبات معلّقة"
            value={String(stats?.pendingOrders ?? 0)}
            color={Colors.status.warning}
          />
          <StatCard
            icon="bag-check-outline"
            label="طلبات اليوم"
            value={String(stats?.todayOrders ?? 0)}
            color={Colors.status.info}
          />
          <StatCard
            icon="cash-outline"
            label="مبيعات اليوم"
            value={`${(stats?.todayRevenue ?? 0).toFixed(0)} ل.س`}
            color={Colors.status.success}
          />
          <StatCard
            icon="analytics-outline"
            label="إجمالي المبيعات"
            value={`${(stats?.totalRevenue ?? 0).toFixed(0)} ل.س`}
            color={Colors.gold.dark}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أدوات الإدارة</Text>
        </View>

        <View style={styles.actions}>
          <ActionCard
            icon="cube-outline"
            title="المنتجات"
            subtitle="إدارة قائمة منتجاتك"
            onPress={() => router.push("/(merchant)/products")}
            color={Colors.primary.main}
          />
          <ActionCard
            icon="receipt-outline"
            title="الطلبات"
            subtitle="استعرض طلبات العملاء"
            onPress={() => router.push("/(merchant)/orders")}
            color={Colors.gold.dark}
          />
          <ActionCard
            icon="storefront-outline"
            title="بيانات المتجر"
            subtitle="تعديل الاسم والشعار"
            onPress={() => router.push("/(merchant)/setup-store")}
            color={Colors.status.info}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  color,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
    </Pressable>
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
  headerLeft: { flexDirection: "row", gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  hi: { fontSize: FontSize.xs, color: Colors.text.muted },
  storeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  heroWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  hero: {
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: "row-reverse",
    alignItems: "center",
    ...Shadow.md,
  },
  heroTitle: {
    color: "#fff",
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: "right",
  },
  heroSub: {
    color: Colors.primary.soft,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: "right",
  },
  statsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  actions: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  actionCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9 },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  actionSub: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
});
