// src/app/(driver)/index.tsx
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
import { useViewMode } from "@/context/ViewModeContext";
import { driverService } from "@/services/driver";
import type { Driver, DriverStats, Order } from "@/types";

export default function DriverDashboard() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { setViewMode } = useViewMode();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const d = await driverService.getMyDriver(user.id);
      setDriver(d);
      if (d) {
        const [s, active, available] = await Promise.all([
          driverService.getStats(d.id),
          driverService.listActiveOrders(d.id),
          driverService.listAvailableOrders(),
        ]);
        setStats(s);
        setActiveOrders(active);
        setAvailableCount(available.length);
      }
    } catch (e) {
      console.error("Driver dashboard load:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime
  useEffect(() => {
    if (!driver?.id) return;

    let unsubAvailable: (() => void) | null = null;
    let unsubMine: (() => void) | null = null;
    let mounted = true;

    const t = setTimeout(() => {
      if (!mounted) return;
      unsubAvailable = driverService.subscribeAvailableOrders(load);
      unsubMine = driverService.subscribeMyOrders(driver.id, load);
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(t);
      unsubAvailable?.();
      unsubMine?.();
    };
  }, [driver?.id, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSwitchToClient = async () => {
    if (!user?.id) return;
    try {
      await driverService.demoteToClient(user.id);
      await refreshProfile();
      await setViewMode("client");
      router.replace("/(client)");
    } catch (e: any) {
      console.error("Switch to client:", e);
    }
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  // لا يوجد سجل كابتن
  if (!driver) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لست مسجّلاً كمندوب بعد"
          message="سجّل الآن وابدأ باستقبال طلبات التوصيل."
          actionLabel="التسجيل كمندوب"
          onAction={() => router.push("/(driver)/setup-driver")}
          icon={
            <Ionicons
              name="bicycle-outline"
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
          <View style={styles.headerLeft}>
            <Pressable style={styles.iconBtn} onPress={handleSwitchToClient}>
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={Colors.primary.main}
              />
            </Pressable>
          </View>
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <Text style={styles.hi}>مرحباً بك</Text>
            <Text style={styles.driverName}>كابتن طلبناه</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>لوحة الكابتن</Text>
              <Text style={styles.heroSub}>رحلتك أسهل.. وطريقك أوضح</Text>
            </View>
            <Ionicons
              name="bicycle"
              size={56}
              color={Colors.gold.main}
              style={{ opacity: 0.4 }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="star"
            label="التقييم"
            value={String(stats?.rating ?? 4.8)}
            color={Colors.gold.dark}
          />
          <StatCard
            icon="cube-outline"
            label="توصيلات اليوم"
            value={String(stats?.todayOrders ?? 0)}
            color={Colors.status.info}
          />
          <StatCard
            icon="cash-outline"
            label="أرباح اليوم"
            value={`${(stats?.todayEarnings ?? 0).toFixed(0)} ل.س`}
            color={Colors.status.success}
          />
          <StatCard
            icon="checkmark-done-outline"
            label="إجمالي التوصيلات"
            value={String(stats?.totalDelivered ?? 0)}
            color={Colors.primary.main}
          />
        </View>

        {/* Active Order */}
        {activeOrders.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>طلب جارٍ</Text>
            </View>
            {activeOrders.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/(driver)/order/${o.id}` as any)}
                style={({ pressed }) => [
                  styles.activeCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.activeIconWrap}>
                  <Ionicons name="navigate" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.activeOrderNum}>
                    #{o.id.slice(0, 6).toUpperCase()}
                  </Text>
                  <Text style={styles.activeOrderTotal}>
                    {Number(o.total_amount).toFixed(2)} ل.س
                  </Text>
                </View>
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={Colors.text.muted}
                />
              </Pressable>
            ))}
          </>
        ) : null}

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الوصول السريع</Text>
        </View>

        <View style={styles.actions}>
          <ActionCard
            icon="list-outline"
            title="الطلبات المتاحة"
            subtitle={
              availableCount > 0
                ? `${availableCount} طلب جاهز`
                : "لا توجد طلبات الآن"
            }
            onPress={() => router.push("/(driver)/available")}
            color={Colors.primary.main}
          />
          <ActionCard
            icon="bicycle-outline"
            title="طلباتي"
            subtitle={`${stats?.totalDelivered ?? 0} توصيلة`}
            onPress={() => router.push("/(driver)/my-orders")}
            color={Colors.gold.dark}
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
  driverName: {
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
  activeCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  activeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeOrderNum: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textAlign: "right",
  },
  activeOrderTotal: {
    color: Colors.gold.main,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
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
