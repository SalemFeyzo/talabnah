// src/app/(merchant)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useViewMode } from "@/context/ViewModeContext";
import { merchantService } from "@/services/merchant";
import type { Merchant } from "@/types";
import { showAlert, showConfirm } from "@/utils/confirm";
import { uploadImage } from "@/utils/storage";

interface Staff {
  id: string;
  merchant_id: string;
  profile_id: string;
  job_title: string;
  can_manage_products: boolean;
  can_manage_orders: boolean;
  created_at: string;
  profile?: {
    id: string;
    full_name: string;
    phone: string;
    role: string;
  };
}

export default function MerchantProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile, signOut } = useAuth();
  const { setViewMode } = useViewMode();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Store modal
  const [storeModal, setStoreModal] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [savingStore, setSavingStore] = useState(false);

  // Staff modal
  const [staffModal, setStaffModal] = useState(false);
  const [staffPhone, setStaffPhone] = useState("");
  const [staffJob, setStaffJob] = useState("");
  const [staffProducts, setStaffProducts] = useState(false);
  const [staffOrders, setStaffOrders] = useState(true);
  const [savingStaff, setSavingStaff] = useState(false);

  // ============ Load ============
  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const m = await merchantService.getMyMerchant(user.id);
      setMerchant(m);
      if (m) {
        setStoreName(m.store_name);
        setStoreAddress(m.address ?? "");
        const list = await merchantService.listStaff(m.id);
        setStaff(list);
      }
    } catch (e) {
      console.error("Load merchant profile:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // ============ Logo Picker ============
  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert("تنبيه", "نحتاج صلاحية الوصول للصور");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setLogoUri(res.assets[0].uri);
    }
  };

  // ============ Save Store ============
  const handleSaveStore = async () => {
    if (!merchant || !user?.id) return;
    if (!storeName.trim()) {
      showAlert("تنبيه", "أدخل اسم المتجر");
      return;
    }

    setSavingStore(true);
    try {
      let logoUrl = merchant.logo_url;
      if (logoUri) {
        const uploaded = await uploadImage(
          logoUri,
          `merchants/${user.id}/logo`,
        );
        if (uploaded) logoUrl = uploaded;
      }

      const updated = await merchantService.updateStore(merchant.id, {
        store_name: storeName.trim(),
        address: storeAddress.trim() || null,
        logo_url: logoUrl,
      });

      setMerchant(updated);
      setLogoUri(null);
      setStoreModal(false);
      showAlert("✅", "تم تحديث بيانات المتجر");
    } catch (e: any) {
      console.error("Save store:", e);
      showAlert("خطأ", e?.message ?? "تعذّر الحفظ");
    } finally {
      setSavingStore(false);
    }
  };

  // ============ Toggle Store Active ============
  const handleToggleActive = () => {
    if (!merchant) return;
    const newState = !merchant.is_active;
    showConfirm(
      newState ? "فتح المتجر" : "إغلاق المتجر",
      newState
        ? "سيتمكن العملاء من الطلب من متجرك."
        : "لن يتمكن العملاء من الطلب مؤقتاً.",
      async () => {
        try {
          const updated = await merchantService.toggleActive(
            merchant.id,
            merchant.is_active,
          );
          setMerchant(updated);
          showAlert(
            "✅",
            newState ? "المتجر مفتوح الآن" : "المتجر مغلق مؤقتاً",
          );
        } catch (e: any) {
          showAlert("خطأ", e?.message ?? "تعذّر التحديث");
        }
      },
    );
  };

  // ============ Add Staff (مع تحقق كامل) ============
  const handleAddStaff = async () => {
    if (!merchant) return;

    // ⚡ التحقق المحلي أولاً
    const cleanPhone = staffPhone.replace(/[\s\-()]/g, "").trim();

    if (!cleanPhone) {
      showAlert("تنبيه", "أدخل رقم هاتف الموظف");
      return;
    }
    if (cleanPhone.length < 9) {
      showAlert("تنبيه", "رقم الهاتف قصير جداً\nأدخل على الأقل 9 أرقام");
      return;
    }
    if (!staffJob.trim()) {
      showAlert("تنبيه", "أدخل المسمى الوظيفي");
      return;
    }
    if (staffJob.trim().length < 2) {
      showAlert("تنبيه", "المسمى الوظيفي قصير جداً");
      return;
    }

    setSavingStaff(true);
    try {
      // 1. تحقق مسبق: هل المستخدم موجود؟
      const check = await merchantService.findUserByPhone(cleanPhone);

      if (!check.found || !check.profile) {
        let msg = `لا يوجد مستخدم مسجّل بالرقم:\n${cleanPhone}`;

        if (check.suggestions && check.suggestions.length > 0) {
          msg += "\n\nهل تقصد:\n";
          msg += check.suggestions
            .map((s) => `• ${s.full_name} — ${s.phone}`)
            .join("\n");
        } else {
          msg += "\n\nتأكد من أن المستخدم أنشأ حساباً في طلبناه كعميل أولاً.";
        }

        setSavingStaff(false);
        showAlert("لم يُعثر على المستخدم", msg);
        return;
      }

      // 2. تحقق: هل الدور مناسب؟
      const role = check.profile.role;
      if (role === "ADMIN" || role === "SYSTEM_STAFF") {
        setSavingStaff(false);
        showAlert("تنبيه", "لا يمكن إضافة أدمن أو موظف نظام كموظف متجر");
        return;
      }
      if (role === "MERCHANT") {
        setSavingStaff(false);
        showAlert("تنبيه", "لا يمكن إضافة صاحب متجر آخر كموظف");
        return;
      }
      if (role === "DRIVER") {
        setSavingStaff(false);
        showAlert("تنبيه", "لا يمكن إضافة كابتن توصيل كموظف متجر");
        return;
      }

      // 3. أضف الموظف
      await merchantService.addStaff({
        merchant_id: merchant.id,
        phone: cleanPhone,
        job_title: staffJob.trim(),
        can_manage_products: staffProducts,
        can_manage_orders: staffOrders,
      });

      await load();
      setStaffModal(false);
      setStaffPhone("");
      setStaffJob("");
      setStaffProducts(false);
      setStaffOrders(true);
      showAlert(
        "✅",
        `تم إضافة "${check.profile.full_name}" كموظف\nسيتمكن من الدخول كمزود خدمة عند تسجيل الدخول`,
      );
    } catch (e: any) {
      console.error("Add staff:", e);
      showAlert("خطأ", e?.message ?? "تعذّر الإضافة");
    } finally {
      setSavingStaff(false);
    }
  };

  // ============ Remove Staff ============
  const confirmRemoveStaff = (s: Staff) => {
    showConfirm(
      "حذف الموظف",
      `هل تريد إزالة "${s.profile?.full_name ?? "الموظف"}"؟\nسيتم إرجاع دوره إلى عميل.`,
      async () => {
        try {
          await merchantService.removeStaff(s.id);
          setStaff((prev) => prev.filter((x) => x.id !== s.id));
          showAlert("✅", "تم حذف الموظف وإرجاع دوره");
        } catch (e: any) {
          showAlert("خطأ", e?.message ?? "تعذّر الحذف");
        }
      },
      "حذف",
    );
  };

  // ============ Switch to Client ============
  const handleSwitchToClient = async () => {
    if (!user?.id) return;
    try {
      await merchantService.demoteToClient(user.id);
      await refreshProfile();
      await setViewMode("client");
      router.replace("/(client)");
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر التبديل");
    }
  };

  // ============ Sign Out ============
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

  // ============ Loading ============
  if (loading) return <AppLoader message="جاري التحميل..." />;

  if (!merchant) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لا يوجد متجر"
          message="أنشئ متجرك أولاً."
          actionLabel="إنشاء متجر"
          onAction={() => router.push("/(merchant)/setup-store")}
        />
      </ScreenContainer>
    );
  }

  // ============ Main ============
  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>متجري</Text>
        </View>

        {/* Store Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeLogoWrap}>
            {merchant.logo_url ? (
              <Image
                source={{ uri: merchant.logo_url }}
                style={styles.storeLogo}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="storefront" size={40} color={Colors.gold.main} />
            )}
          </View>
          <Text style={styles.storeName}>{merchant.store_name}</Text>
          {merchant.address ? (
            <Text style={styles.storeAddress}>{merchant.address}</Text>
          ) : null}

          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: merchant.is_active
                    ? Colors.status.success
                    : Colors.status.error,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {merchant.is_active ? "نشط" : "مغلق"}
            </Text>
          </View>
        </View>

        {/* Store Actions */}
        <SectionCard title="إدارة المتجر" icon="settings-outline">
          <Pressable
            onPress={() => setStoreModal(true)}
            style={({ pressed }) => [
              styles.settingRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="create-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>تعديل بيانات المتجر</Text>
            </View>
          </Pressable>

          <View style={[styles.settingRow, styles.lastRow]}>
            <Switch
              value={merchant.is_active}
              onValueChange={handleToggleActive}
              trackColor={{
                false: Colors.gray[300],
                true: Colors.status.success,
              }}
              thumbColor="#fff"
            />
            <View style={styles.settingLeft}>
              <Ionicons
                name={
                  merchant.is_active
                    ? "lock-open-outline"
                    : "lock-closed-outline"
                }
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>
                {merchant.is_active ? "المتجر مفتوح" : "المتجر مغلق"}
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* Staff Management */}
        <SectionCard title="الموظفون" icon="people-outline">
          {staff.length === 0 ? (
            <View style={styles.emptyStaff}>
              <Ionicons
                name="person-add-outline"
                size={40}
                color={Colors.text.muted}
              />
              <Text style={styles.emptyStaffText}>لا يوجد موظفون بعد</Text>
              <Text style={styles.emptyStaffSub}>
                أضف موظفاً برقم هاتفه — سيتم ترقيته تلقائياً إلى موظف متجر
              </Text>
            </View>
          ) : (
            staff.map((s, idx) => (
              <View
                key={s.id}
                style={[
                  styles.staffRow,
                  idx < staff.length - 1 && styles.staffRowBorder,
                ]}
              >
                <View style={styles.staffInfo}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {s.profile?.full_name?.charAt(0).toUpperCase() ?? "؟"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName} numberOfLines={1}>
                      {s.profile?.full_name ?? "موظف"}
                    </Text>
                    <Text style={styles.staffJob} numberOfLines={1}>
                      {s.job_title} • {s.profile?.phone}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => confirmRemoveStaff(s)}
                  style={styles.removeBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={Colors.status.error}
                  />
                </Pressable>
              </View>
            ))
          )}

          <Pressable
            onPress={() => setStaffModal(true)}
            style={({ pressed }) => [
              styles.addStaffBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={18} color={Colors.primary.main} />
            <Text style={styles.addStaffText}>إضافة موظف</Text>
          </Pressable>
        </SectionCard>

        {/* Switch to client */}
        <SectionCard title="التبديل" icon="swap-horizontal-outline">
          <Pressable
            onPress={handleSwitchToClient}
            style={({ pressed }) => [
              styles.settingRow,
              styles.lastRow,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text.muted} />
            <View style={styles.settingLeft}>
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.settingText}>التبديل إلى عميل</Text>
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

        <Text style={styles.version}>طلبناه v0.0.1 — لوحة التاجر</Text>
      </ScrollView>

      {/* ============ Edit Store Modal ============ */}
      <Modal
        visible={storeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setStoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل بيانات المتجر</Text>
              <Pressable onPress={() => setStoreModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable style={styles.logoPicker} onPress={pickLogo}>
                {logoUri || merchant.logo_url ? (
                  <Image
                    source={{ uri: logoUri || merchant.logo_url! }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={26}
                      color={Colors.text.muted}
                    />
                    <Text style={styles.imagePickerText}>اختر شعاراً</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.label}>اسم المتجر *</Text>
              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="اسم المتجر"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.label}>العنوان</Text>
              <TextInput
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="الحي، الشارع، رقم المبنى"
                placeholderTextColor={Colors.text.muted}
                style={[styles.input, styles.textArea]}
                multiline
                textAlign="right"
                textAlignVertical="top"
              />

              <AppButton
                label={savingStore ? "جاري الحفظ..." : "حفظ التعديلات"}
                onPress={handleSaveStore}
                loading={savingStore}
                disabled={savingStore}
                variant="primary"
                fullWidth
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============ Add Staff Modal ============ */}
      <Modal
        visible={staffModal}
        animationType="slide"
        transparent
        onRequestClose={() => setStaffModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة موظف</Text>
              <Pressable onPress={() => setStaffModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>رقم هاتف الموظف *</Text>
              <TextInput
                value={staffPhone}
                onChangeText={setStaffPhone}
                placeholder="09XXXXXXXX"
                placeholderTextColor={Colors.text.muted}
                keyboardType="phone-pad"
                style={styles.input}
                textAlign="right"
              />
              <Text style={styles.hint}>
                يجب أن يكون الموظف مسجّلاً في طلبناه كعميل أولاً
              </Text>

              <Text style={styles.label}>المسمى الوظيفي *</Text>
              <TextInput
                value={staffJob}
                onChangeText={setStaffJob}
                placeholder="مثال: مدير فرع، كاشير..."
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.label}>الصلاحيات</Text>
              <View style={styles.permRow}>
                <Switch
                  value={staffProducts}
                  onValueChange={setStaffProducts}
                  trackColor={{
                    false: Colors.gray[300],
                    true: Colors.primary.main,
                  }}
                  thumbColor="#fff"
                />
                <Text style={styles.permLabel}>إدارة المنتجات</Text>
              </View>
              <View style={styles.permRow}>
                <Switch
                  value={staffOrders}
                  onValueChange={setStaffOrders}
                  trackColor={{
                    false: Colors.gray[300],
                    true: Colors.primary.main,
                  }}
                  thumbColor="#fff"
                />
                <Text style={styles.permLabel}>إدارة الطلبات</Text>
              </View>

              <AppButton
                label={savingStaff ? "جاري الإضافة..." : "إضافة الموظف"}
                onPress={handleAddStaff}
                loading={savingStaff}
                disabled={savingStaff}
                variant="primary"
                fullWidth
                style={{ marginTop: Spacing.lg }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  header: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  storeCard: {
    alignItems: "center",
    backgroundColor: Colors.primary.main,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  storeLogoWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.gold.main,
  },
  storeLogo: { width: "100%", height: "100%" },
  storeName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: "#fff",
    textAlign: "center",
  },
  storeAddress: {
    fontSize: FontSize.sm,
    color: Colors.primary.soft,
    marginTop: 4,
    textAlign: "center",
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    color: "#fff",
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
  settingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  lastRow: { borderBottomWidth: 0 },
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
  pressed: { opacity: 0.75 },
  emptyStaff: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  emptyStaffText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  emptyStaffSub: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
  },
  staffRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  staffRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  staffInfo: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
  },
  staffName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  staffJob: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.status.errorSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addStaffBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary.main,
    marginTop: Spacing.md,
  },
  addStaffText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.background.paper,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  logoPicker: {
    width: 110,
    height: 110,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border.dark,
    backgroundColor: Colors.background.default,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePickerText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 4,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background.default,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  textArea: { minHeight: 80 },
  permRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  permLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
});
