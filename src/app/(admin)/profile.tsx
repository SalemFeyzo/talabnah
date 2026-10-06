// src/app/(admin)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { showAlert, showConfirm } from "@/utils/confirm";
import { supabase } from "@/utils/supabase";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ============ حفظ البيانات ============
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

  // ============ تغيير كلمة المرور ============
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
      "هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة الأدمن؟",
      performSignOut,
      "خروج",
    );
  };

  // ============ تفعيل وضع الصيانة ============
  const handleMaintenanceToggle = (value: boolean) => {
    showConfirm(
      value ? "تفعيل وضع الصيانة" : "إيقاف وضع الصيانة",
      value
        ? "سيتم إيقاف التطبيق مؤقتاً للعملاء. متابعة؟"
        : "سيتم إعادة تشغيل التطبيق للعملاء. متابعة؟",
      () => {
        setMaintenanceMode(value);
        showAlert(
          "✅",
          value ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة",
        );
      },
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
          <View style={styles.adminBadge}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={Colors.gold.main}
            />
            <Text style={styles.adminBadgeText}>مدير</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.profileName}>{fullName || "مدير"}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.rolePill}>
            <Ionicons
              name="shield-checkmark"
              size={12}
              color={Colors.gold.main}
            />
            <Text style={styles.rolePillText}>ADMIN</Text>
          </View>
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

        {/* Admin Tools */}
        <SectionCard title="أدوات النظام" icon="settings-outline">
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
              <Text style={styles.settingText}>تنبيهات النظام</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Switch
              value={maintenanceMode}
              onValueChange={handleMaintenanceToggle}
              trackColor={{
                false: Colors.gray[300],
                true: Colors.status.warning,
              }}
              thumbColor="#fff"
            />
            <View style={styles.settingLeft}>
              <Ionicons
                name="construct-outline"
                size={18}
                color={Colors.status.warning}
              />
              <Text style={styles.settingText}>وضع الصيانة</Text>
            </View>
          </View>

          <Pressable
            onPress={() => showAlert("قريباً", "سجل النشاط قريباً")}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>سجل النشاط</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => showAlert("قريباً", "النسخ الاحتياطي قريباً")}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>النسخ الاحتياطي</Text>
            </View>
          </Pressable>
        </SectionCard>

        {/* Security */}
        <SectionCard title="الأمان" icon="lock-closed-outline">
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
                name="key-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>تغيير كلمة المرور</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => showAlert("قريباً", "الجلسات النشطة قريباً")}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>الجلسات النشطة</Text>
            </View>
          </Pressable>
        </SectionCard>

        {/* About */}
        <SectionCard title="عن التطبيق" icon="information-circle-outline">
          <View style={styles.aboutRow}>
            <Text style={styles.aboutValue}>0.0.1</Text>
            <Text style={styles.aboutLabel}>الإصدار</Text>
          </View>
          <View style={styles.aboutDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutValue}>طلبناه</Text>
            <Text style={styles.aboutLabel}>التطبيق</Text>
          </View>
          <View style={styles.aboutDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutValue}>2026</Text>
            <Text style={styles.aboutLabel}>السنة</Text>
          </View>
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

        <Text style={styles.version}>طلبناه v0.0.1 — لوحة الأدمن</Text>
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
  adminBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold.soft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  adminBadgeText: {
    color: Colors.gold.dark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
  rolePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  rolePillText: {
    color: Colors.gold.main,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
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
  aboutRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  aboutLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  aboutValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
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
