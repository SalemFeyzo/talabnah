// src/app/(driver)/setup-driver.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { driverService } from "@/services/driver";
import { showAlert } from "@/utils/confirm";

const VEHICLES = [
  { key: "motorcycle", label: "دراجة نارية", icon: "bicycle" },
  { key: "car", label: "سيارة", icon: "car" },
  { key: "bicycle", label: "دراجة هوائية", icon: "bicycle" },
  { key: "on_foot", label: "سيراً على الأقدام", icon: "walk" },
] as const;

export default function SetupDriverScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [licensePlate, setLicensePlate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) {
      showAlert("خطأ", "الجلسة منتهية");
      return;
    }

    setSaving(true);
    try {
      await driverService.register(user.id, {
        vehicle_type: vehicleType,
        license_plate: licensePlate.trim() || null,
      });

      await refreshProfile();
      showAlert("🎉 مبروك!", "تم تسجيلك كمندوب توصيل");
      router.replace("/(driver)");
    } catch (e: any) {
      console.error("Register driver error:", e);
      showAlert("فشل", e?.message ?? "تعذّر التسجيل");
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
          <Text style={styles.headerTitle}>التسجيل كمندوب</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="bicycle" size={42} color={Colors.gold.main} />
            </View>
            <Text style={styles.heroTitle}>انضم ككابتن توصيل</Text>
            <Text style={styles.heroSub}>رحلتك أسهل.. وطريقك أوضح</Text>
          </View>

          <Text style={styles.label}>نوع المركبة *</Text>
          <View style={styles.vehiclesGrid}>
            {VEHICLES.map((v) => {
              const active = vehicleType === v.key;
              return (
                <Pressable
                  key={v.key}
                  onPress={() => setVehicleType(v.key)}
                  style={[
                    styles.vehicleCard,
                    active && styles.vehicleCardActive,
                  ]}
                >
                  <Ionicons
                    name={v.icon as any}
                    size={26}
                    color={active ? Colors.primary.main : Colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.vehicleLabel,
                      active && styles.vehicleLabelActive,
                    ]}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <AppInput
            label="رقم اللوحة (اختياري)"
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder="مثال: 123456"
          />

          <AppButton
            label={saving ? "جاري التسجيل..." : "تسجيل كمندوب"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />

          <Text style={styles.note}>
            ملاحظة: التسجيل مجاني ويمكنك إلغاؤه في أي وقت.
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
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  vehiclesGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  vehicleCard: {
    width: "48%",
    backgroundColor: Colors.background.paper,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  vehicleCardActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.soft,
  },
  vehicleLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  vehicleLabelActive: {
    color: Colors.primary.main,
    fontWeight: FontWeight.bold,
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
