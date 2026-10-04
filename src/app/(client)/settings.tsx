// src/app/(client)/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppInput } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useViewMode } from "@/context/ViewModeContext";
import { merchantService } from "@/services/merchant";
import { showAlert, showConfirm } from "@/utils/confirm";
import { supabase } from "@/utils/supabase";

export default function ClientSettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { setViewMode } = useViewMode();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [switching, setSwitching] = useState(false);

  // ============ حفظ البيانات الشخصية ============
  const handleUpdate = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      showAlert("تنبيه", "أدخل الاسم الكامل");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      showAlert("✅", "تم تحديث البيانات");
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر التحديث");
    } finally {
      setSaving(false);
    }
  };

  // ============ التبديل إلى تاجر ============
  const handleSwitchToMerchant = async () => {
    if (!user?.id) return;
    setSwitching(true);
    try {
      const merchant = await merchantService.getMyMerchant(user.id);

      if (merchant) {
        await merchantService.promoteToMerchant(user.id);
        await refreshProfile();
        await setViewMode("merchant");
        router.replace("/(merchant)");
      } else {
        router.push("/(merchant)/setup-store" as any);
      }
    } catch (e: any) {
      console.error("Switch to merchant:", e);
      showAlert("خطأ", e?.message ?? "تعذّر التبديل");
    } finally {
      setSwitching(false);
    }
  };

  // ============ تسجيل الخروج ============
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
    showConfirm(
      "تسجيل الخروج",
      "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
      performSignOut,
      "خروج",
    );
  };

  // ============ إعادة تعيين كلمة المرور ============
  const handleResetPassword = () => {
    if (!user?.email) return;
    showConfirm(
      "تغيير كلمة المرور",
      `سيتم إرسال رابط إلى:\n${user.email}`,
      async () => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(
            user.email!,
          );
          if (error) throw error;
          showAlert("✅", "تم إرسال رابط التغيير إلى بريدك");
        } catch (e: any) {
          showAlert("خطأ", e?.message ?? "تعذّر الإرسال");
        }
      },
      "إرسال",
    );
  };

  const avatarLetter =
    fullName?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "؟";

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>حسابي</Text>
          <Pressable style={styles.iconBtn}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={Colors.primary.main}
            />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.profileName}>{fullName || "مستخدم"}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Personal Data */}
        <SectionCard title="البيانات الشخصية" icon="person-outline">
          <AppInput
            label="البريد الإلكتروني"
            value={user?.email ?? ""}
            editable={false}
            containerStyle={{ marginBottom: Spacing.sm }}
          />
          <AppInput
            label="الاسم الكامل"
            value={fullName}
            onChangeText={setFullName}
            placeholder="أدخل اسمك"
          />
          <AppInput
            label="رقم الهاتف"
            value={phone}
            onChangeText={setPhone}
            placeholder="09XXXXXXXX"
            keyboardType="phone-pad"
          />
          <AppButton
            label={saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            onPress={handleUpdate}
            loading={saving}
            disabled={saving}
            variant="primary"
            fullWidth
          />
        </SectionCard>

        {/* Merchant Switch */}
        <SectionCard title="الأنشطة التجارية" icon="storefront-outline">
          <Pressable
            onPress={handleSwitchToMerchant}
            disabled={switching}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIconBox}>
              {switching ? (
                <ActivityIndicator color={Colors.gold.dark} />
              ) : (
                <Ionicons
                  name="storefront"
                  size={20}
                  color={Colors.gold.dark}
                />
              )}
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.actionTitle}>التبديل إلى التاجر</Text>
              <Text style={styles.actionSub}>إدارة متجرك ومنتجاتك وطلباتك</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color={Colors.gold.dark} />
          </Pressable>

          <Pressable
            onPress={() => showAlert("قريباً", "التسجيل كمندوب توصيل قريباً")}
            style={({ pressed }) => [
              styles.actionRow,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[styles.actionIconBox, { backgroundColor: "#FEF3C720" }]}
            >
              <Ionicons name="bicycle" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.actionTitle}>الانضمام كمندوب توصيل</Text>
              <Text style={styles.actionSub}>قريباً</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#D97706" />
          </Pressable>
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="التفضيلات والأمان" icon="shield-checkmark-outline">
          <View style={styles.settingRow}>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{
                false: Colors.gray[300],
                true: Colors.primary.main,
              }}
              thumbColor="#fff"
            />
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>تفعيل التنبيهات</Text>
            </View>
          </View>

          <Pressable
            onPress={handleResetPassword}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>تغيير كلمة المرور</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => showAlert("قريباً", "الدعم الفني قريباً")}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="help-circle-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>المساعدة والدعم</Text>
            </View>
          </Pressable>
        </SectionCard>

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

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={Colors.primary.main} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.primary.soft,
    marginTop: 4,
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
  actionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.gold.soft,
    marginTop: Spacing.sm,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: FontSize.sm,
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
  settingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLeft: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
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
  pressed: { opacity: 0.75 },
  version: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
