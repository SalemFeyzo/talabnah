import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientSettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();

  // حالات البيانات الشخصية
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // حالات الإعدادات
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);

  // تحديث البيانات الشخصية
  const handleUpdateProfile = async () => {
    if (!user?.id) {
      Alert.alert("خطأ", "لم يتم العثور على بيانات الجلسة الحالية");
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال الاسم الكامل");
      return;
    }

    try {
      setUpdatingProfile(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      if (refreshProfile) await refreshProfile();
      Alert.alert("نجاح", "تم تحديث البيانات الشخصية بنجاح");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("خطأ", error.message || "فشل في تحديث البيانات");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // إعادة ضبط كلمة المرور عبر البريد
  const handleResetPassword = async () => {
    if (!user?.email) return;

    Alert.alert(
      "تأكيد",
      `هل ترغب في إرسال رابط إعادة تعيين كلمة المرور إلى البريد:\n${user.email}؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إرسال",
          onPress: async () => {
            try {
              setSavingPassword(true);
              const { error } = await supabase.auth.resetPasswordForEmail(
                user.email!,
              );
              if (error) throw error;
              Alert.alert(
                "نجاح",
                "تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني",
              );
            } catch (error: any) {
              Alert.alert("خطأ", error.message);
            } finally {
              setSavingPassword(false);
            }
          },
        },
      ],
    );
  };

  // تسجيل الخروج
  const handleSignOut = async () => {
    Alert.alert("تسجيل الخروج", "هل أنت تأكد من رغبتك في تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* العنوان الرئيسي */}
      <Text style={styles.headerTitle}>إعدادات الحساب</Text>

      {/* قسم البيانات الشخصية */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>البيانات الشخصية</Text>
            <Text style={styles.cardSubTitle}>
              إدارة اسم المستخدم وتفاصيل التواصل
            </Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            value={user?.email || ""}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="أدخل اسمك الكامل"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="09XXXXXXXX"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={handleUpdateProfile}
          disabled={updatingProfile}
          style={styles.primaryButton}
        >
          {updatingProfile ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>حفظ التغييرات</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* قسم تحويل الحساب وإنشاء المتجر */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ترقية الحساب والأنشطة</Text>
        <Text style={styles.cardSubTitle}>
          ابدأ البيع أو التوصيل عبر المنصة
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(merchant)/setup-store")}
          style={[styles.actionRow, styles.merchantBg]}
        >
          <View style={styles.actionRight}>
            <View style={[styles.iconBox, styles.merchantIconBox]}>
              <Ionicons name="storefront-outline" size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.actionTitle}>
                إنشاء متجر جديد / التحويل لتاجر
              </Text>
              <Text style={styles.actionSubTitle}>
                عرض المنتجات وإدارة الطلبات
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-back" size={18} color="#2563eb" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            Alert.alert("قريباً", "سيتم إتاحة التسجيل لمندوبي التوصيل قريباً")
          }
          style={[styles.actionRow, styles.driverBg]}
        >
          <View style={styles.actionRight}>
            <View style={[styles.iconBox, styles.driverIconBox]}>
              <Ionicons name="bicycle-outline" size={20} color="#d97706" />
            </View>
            <View>
              <Text style={styles.actionTitle}>الانضمام كـ كابتن توصيل</Text>
              <Text style={styles.actionSubTitle}>
                توصيل الطلبات وتحقيق دخل إضافي
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-back" size={18} color="#d97706" />
        </TouchableOpacity>
      </View>

      {/* قسم التفضيلات والأمان */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>التفضيلات والأمان</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingRight}>
            <Ionicons name="notifications-outline" size={20} color="#4b5563" />
            <Text style={styles.settingText}>تفعيل التنبيهات</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#d1d5db", true: "#2563eb" }}
          />
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={savingPassword}
          style={styles.settingRow}
        >
          <View style={styles.settingRight}>
            <Ionicons name="lock-closed-outline" size={20} color="#4b5563" />
            <Text style={styles.settingText}>تغيير كلمة المرور</Text>
          </View>
          {savingPassword ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Ionicons name="chevron-back" size={18} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>

      {/* زر تسجيل الخروج */}
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.signOutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "right",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  avatarText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "right",
  },
  cardSubTitle: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "right",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f2937",
    textAlign: "right",
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#9ca3af",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  merchantBg: {
    backgroundColor: "#eff6ff",
    borderColor: "#dbeafe",
  },
  driverBg: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  actionRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  merchantIconBox: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  driverIconBox: {
    backgroundColor: "rgba(217, 119, 6, 0.1)",
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "right",
  },
  actionSubTitle: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  settingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  signOutText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
    marginRight: 8,
  },
});
