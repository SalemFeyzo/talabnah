// src/app/(admin)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { adminService } from "@/services/admin";
import type { AdminStats } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await adminService.getStats();
      setStats(s);
    } catch (e) {
      console.error("Admin stats:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    const t = setTimeout(() => {
      if (!mounted) return;
      unsub = adminService.subscribeAllOrders(load);
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(t);
      unsub?.();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header — بدون زر تبديل */}
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.hi}>لوحة التحكم</Text>
            <Text style={styles.adminName}>مدير طلبناه</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>نظرة عامة</Text>
              <Text style={styles.heroSub}>إدارة شاملة للتطبيق</Text>
            </View>
            <Ionicons
              name="shield-checkmark"
              size={56}
              color={Colors.gold.main}
              style={{ opacity: 0.4 }}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people-outline"
            label="المستخدمون"
            value={String(stats?.totalUsers ?? 0)}
            color={Colors.status.info}
          />
          <StatCard
            icon="storefront-outline"
            label="المتاجر"
            value={String(stats?.totalMerchants ?? 0)}
            color={Colors.gold.dark}
          />
          <StatCard
            icon="bicycle-outline"
            label="الكباتن"
            value={String(stats?.totalDrivers ?? 0)}
            color={Colors.primary.main}
          />
          <StatCard
            icon="receipt-outline"
            label="إجمالي الطلبات"
            value={String(stats?.totalOrders ?? 0)}
            color={Colors.status.success}
          />
        </View>

        {/* Financial */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الإيرادات</Text>
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueValue}>
              {(stats?.totalRevenue ?? 0).toFixed(0)} ل.س
            </Text>
            <Text style={styles.revenueLabel}>إجمالي الإيرادات</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueRow}>
            <Text style={styles.revenueValueGold}>
              {(stats?.todayRevenue ?? 0).toFixed(0)} ل.س
            </Text>
            <Text style={styles.revenueLabel}>إيرادات اليوم</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueRow}>
            <Text style={styles.revenueValue}>{stats?.todayOrders ?? 0}</Text>
            <Text style={styles.revenueLabel}>طلبات اليوم</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueRow}>
            <Text
              style={[styles.revenueValue, { color: Colors.status.warning }]}
            >
              {stats?.pendingOrders ?? 0}
            </Text>
            <Text style={styles.revenueLabel}>طلبات قيد التنفيذ</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أدوات الإدارة</Text>
        </View>

        <View style={styles.actions}>
          <ActionCard
            icon="people-outline"
            title="المستخدمون"
            subtitle="عرض وإدارة جميع المستخدمين"
            onPress={() => router.push("/(admin)/users")}
            color={Colors.status.info}
          />
          <ActionCard
            icon="storefront-outline"
            title="المتاجر"
            subtitle="تفعيل/تعطيل المتاجر"
            onPress={() => router.push("/(admin)/merchants")}
            color={Colors.gold.dark}
          />
          <ActionCard
            icon="receipt-outline"
            title="الطلبات"
            subtitle="عرض كل طلبات النظام"
            onPress={() => router.push("/(admin)/orders")}
            color={Colors.status.success}
          />
          <ActionCard
            icon="list-outline"
            title="الأقسام"
            subtitle="إدارة تصنيفات التطبيق"
            onPress={() => router.push("/(admin)/categories")}
            color={Colors.primary.main}
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
  hi: { fontSize: FontSize.xs, color: Colors.text.muted },
  adminName: {
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
  revenueCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  revenueRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  revenueLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  revenueValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  revenueValueGold: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
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
