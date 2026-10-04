// src/app/(merchant)/setup-store.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppInput } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { merchantService } from "@/services/merchant";
import { showAlert } from "@/utils/confirm";
import { uploadImage } from "@/utils/storage";

export default function SetupStoreScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ محدّث للصيغة الجديدة
  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert("تنبيه", "نحتاج صلاحية الوصول للصور");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setLogoUri(res.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      showAlert("خطأ", "الجلسة منتهية");
      return;
    }
    if (!storeName.trim()) {
      showAlert("تنبيه", "أدخل اسم المتجر");
      return;
    }

    setSaving(true);
    try {
      let logoUrl: string | null = null;
      if (logoUri) {
        logoUrl = await uploadImage(logoUri, `merchants/${user.id}/logo`);
      }

      await merchantService.convertClientToMerchant(user.id, {
        store_name: storeName.trim(),
        address: address.trim() || null,
        logo_url: logoUrl,
      });

      await refreshProfile();

      showAlert("🎉 مبروك!", "تم إنشاء متجرك بنجاح");
      router.replace("/(merchant)");
    } catch (e: any) {
      console.error("Setup store error:", e);
      const msg = e?.message?.includes("duplicate")
        ? "لديك متجر مسجل بالفعل"
        : (e?.message ?? "تعذّر إنشاء المتجر");
      showAlert("فشل", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color={Colors.text.primary}
            />
          </Pressable>
          <Text style={styles.headerTitle}>إنشاء المتجر</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="storefront" size={42} color={Colors.gold.main} />
            </View>
            <Text style={styles.heroTitle}>ابدأ رحلتك التجارية</Text>
            <Text style={styles.heroSub}>
              أنشئ متجرك في دقيقة وابدأ باستقبال الطلبات
            </Text>
          </View>

          <Text style={styles.label}>شعار المتجر (اختياري)</Text>
          <View style={styles.logoWrap}>
            {logoUri ? (
              <View style={styles.logoPreviewWrap}>
                <Image source={{ uri: logoUri }} style={styles.logoPreview} />
                <Pressable
                  style={styles.removeLogo}
                  onPress={() => setLogoUri(null)}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.logoPicker} onPress={pickLogo}>
                <Ionicons name="camera" size={28} color={Colors.text.muted} />
                <Text style={styles.logoPickerText}>اختر شعاراً</Text>
              </Pressable>
            )}
          </View>

          <AppInput
            label="اسم المتجر *"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="مثال: مطعم الشام"
            maxLength={60}
          />

          <AppInput
            label="العنوان (اختياري)"
            value={address}
            onChangeText={setAddress}
            placeholder="الحي، الشارع، رقم المبنى"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, paddingTop: 12 }}
          />

          <AppButton
            label={saving ? "جاري الإنشاء..." : "إنشاء المتجر"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />

          <Text style={styles.note}>
            ملاحظة: بعد الإنشاء سيتم ترقية حسابك إلى تاجر تلقائياً.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.default,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  logoWrap: { alignItems: "center", marginBottom: Spacing.lg },
  logoPicker: {
    width: 110,
    height: 110,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border.dark,
    backgroundColor: Colors.background.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPickerText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 4,
  },
  logoPreviewWrap: { position: "relative" },
  logoPreview: {
    width: 110,
    height: 110,
    borderRadius: Radius.xl,
    backgroundColor: Colors.gray[100],
  },
  removeLogo: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.status.error,
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 18,
  },
});
