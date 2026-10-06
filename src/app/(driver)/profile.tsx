// src/app/(driver)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useViewMode } from "@/context/ViewModeContext";
import { driverService } from "@/services/driver";
import type { Driver } from "@/types";
import { showConfirm } from "@/utils/confirm";

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { setViewMode } = useViewMode();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const d = await driverService.getMyDriver(user.id);
      setDriver(d);
    } catch (e) {
      console.error("Load driver profile:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSwitchToClient = async () => {
    if (!user?.id) return;
    try {
      await driverService.demoteToClient(user.id);
      await refreshProfile();
      await setViewMode("client");
      router.replace("/(client)");
    } catch (e) {
      console.error("Switch to client:", e);
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      router.replace("/(auth)/login");
    }
  };

  const handleSignOut = () => {
    showConfirm("تسجيل الخروج", "هل أنت متأكد؟", performSignOut, "خروج");
  };

  if (loading) return <AppLoader />;

  const avatarLetter =
    profile?.full_name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "؟";

  const vehicleLabels: Record<string, string> = {
    motorcycle: "دراجة نارية",
    car: "سيارة",
    bicycle: "دراجة هوائية",
    on_foot: "سيراً على الأقدام",
  };

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>حسابي</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name ?? "كابتن"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.driverBadge}>
            <Ionicons name="bicycle" size={14} color={Colors.gold.main} />
            <Text style={styles.driverBadgeText}>كابتن طلبناه</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        {driver ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="car-outline"
                size={18}
                color={Colors.primary.main}
              />
              <Text style={styles.sectionTitle}>المركبة</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>
                  {vehicleLabels[driver.vehicle_type] ?? driver.vehicle_type}
                </Text>
                <Text style={styles.infoLabel}>النوع</Text>
              </View>
              {driver.license_plate ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{driver.license_plate}</Text>
                    <Text style={styles.infoLabel}>رقم اللوحة</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            onPress={handleSwitchToClient}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="swap-horizontal"
              size={20}
              color={Colors.primary.main}
            />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.actionTitle}>التبديل إلى عميل</Text>
              <Text style={styles.actionSub}>تصفّح واطلب من المتاجر</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.status.error}
          />
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </Pressable>

        <Text style={styles.version}>طلبناه v0.0.1</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  header: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold.main,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.primary.dark,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: "#fff",
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.primary.soft,
    marginTop: 4,
  },
  driverBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  driverBadgeText: {
    color: Colors.gold.main,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  sectionBody: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  infoRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.text.muted },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  actionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.75 },
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
  signOut: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.status.errorSoft,
    borderWidth: 1,
    borderColor: Colors.status.error,
    marginTop: Spacing.md,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.status.error,
  },
  version: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
