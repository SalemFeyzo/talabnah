// src/app/(merchant)/index.tsx
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
import { AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
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

interface StaffInfo {
  id: string;
  job_title: string;
  can_manage_products: boolean;
  can_manage_orders: boolean;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const ctx = await merchantService.getMyStoreContext(user.id);
      console.log("🔍 Store Context:", {
        isOwner: ctx.isOwner,
        merchant: ctx.merchant?.store_name,
        staff: ctx.staff,
      });
      setMerchant(ctx.merchant);
      setIsOwner(ctx.isOwner);
      setStaff(ctx.staff);

      if (ctx.merchant) {
        const s = await orderService.getMerchantStats(ctx.merchant.id);
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

  // Realtime subscription
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

  if (loading) return <AppLoader message="جاري التحميل..." />;

  // لا يوجد متجر
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

  // ⭐ الموظف بدون صلاحيات
  const hasAnyPermission =
    isOwner || staff?.can_manage_products || staff?.can_manage_orders;

  if (!hasAnyPermission) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لا توجد صلاحيات"
          message="ليس لديك أي صلاحيات في هذا المتجر. تواصل مع صاحب المتجر."
          icon={
            <Ionicons
              name="lock-closed-outline"
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
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.hi}>
              {isOwner ? "مرحباً بك" : `مرحباً، ${staff?.job_title ?? "موظف"}`}
            </Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {merchant.store_name}
            </Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>
                {isOwner ? "لوحة التاجر" : "لوحة الموظف"}
              </Text>
              <Text style={styles.heroSub}>
                {merchant.is_active ? "المتجر نشط الآن" : "المتجر مغلق"}
              </Text>

              {!isOwner && staff ? (
                <View style={styles.roleBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={Colors.gold.main}
                  />
                  <Text style={styles.roleBadgeText}>{staff.job_title}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons
              name={isOwner ? "trending-up" : "people"}
              size={56}
              color={Colors.gold.main}
              style={{ opacity: 0.4 }}
            />
          </View>
        </View>

        {/* Stats */}
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

        {/* Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أدوات الإدارة</Text>
        </View>

        <View style={styles.actions}>
          {isOwner || staff?.can_manage_products ? (
            <ActionCard
              icon="cube-outline"
              title="المنتجات"
              subtitle="إدارة قائمة منتجاتك"
              onPress={() => router.push("/(merchant)/products")}
              color={Colors.primary.main}
            />
          ) : null}

          {isOwner || staff?.can_manage_orders ? (
            <ActionCard
              icon="receipt-outline"
              title="الطلبات"
              subtitle="استعرض طلبات العملاء"
              onPress={() => router.push("/(merchant)/orders")}
              color={Colors.gold.dark}
            />
          ) : null}

          {isOwner ? (
            <ActionCard
              icon="storefront-outline"
              title="بيانات المتجر"
              subtitle="تعديل الاسم والشعار والموظفين"
              onPress={() => router.push("/(merchant)/profile")}
              color={Colors.status.info}
            />
          ) : null}
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
  roleBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  roleBadgeText: {
    color: Colors.gold.main,
    fontSize: 10,
    fontWeight: FontWeight.bold,
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
