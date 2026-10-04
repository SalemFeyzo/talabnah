// src/app/(auth)/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { showAlert } from "@/utils/confirm";
import { supabase } from "@/utils/supabase";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      showAlert("تنبيه", "املأ الحقول المطلوبة");
      return;
    }
    if (password.length < 6) {
      showAlert("تنبيه", "كلمة المرور 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          },
        },
      });

      if (error) {
        showAlert("فشل التسجيل", error.message);
        return;
      }

      if (data.session) {
        router.replace("/(client)");
      } else {
        showAlert(
          "✅ تم إنشاء الحساب",
          "يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل.",
        );
        router.replace("/(auth)/login");
      }
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-forward" size={20} color={Colors.gold.main} />
        </Pressable>

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="basket" size={48} color={Colors.gold.main} />
          </View>
          <Text style={styles.brand}>طلبناه</Text>
          <Text style={styles.tagline}>انضم إلى عائلة طلبناه</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>حساب جديد</Text>
          <Text style={styles.cardSub}>ابدأ رحلتك مع طلبناه في دقيقة واحدة</Text>

          <InputField
            icon="person-outline"
            label="الاسم الكامل *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="محمد أحمد"
          />

          <InputField
            icon="mail-outline"
            label="البريد الإلكتروني *"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            icon="call-outline"
            label="رقم الهاتف"
            value={phone}
            onChangeText={setPhone}
            placeholder="09XXXXXXXX"
            keyboardType="phone-pad"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور *</Text>
            <View style={styles.inputWrap}>
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={Colors.text.muted}
                />
              </Pressable>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={Colors.text.muted}
                secureTextEntry={!showPassword}
                style={styles.input}
                textAlign="right"
              />
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.text.muted}
              />
            </View>
          </View>

          <Text style={styles.terms}>
            بالتسجيل، أنت توافق على{" "}
            <Text style={styles.termsLink}>شروط الاستخدام</Text> و{" "}
            <Text style={styles.termsLink}>سياسة الخصوصية</Text>
          </Text>

          <AppButton
            label={loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            variant="primary"
            fullWidth
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={styles.linkText}>تسجيل الدخول</Text>
              </Pressable>
            </Link>
            <Text style={styles.footerMuted}>لديك حساب بالفعل؟</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  label,
  ...rest
}: {
  icon: any;
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={Colors.text.muted} />
        <TextInput
          placeholderTextColor={Colors.text.muted}
          style={styles.input}
          textAlign="right"
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary.main },
  bgDecor1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary.light,
    opacity: 0.35,
  },
  bgDecor2: {
    position: "absolute",
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.primary.dark,
    opacity: 0.4,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  logoWrap: { alignItems: "center", marginBottom: Spacing.xl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.gold.main,
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  brand: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold.main,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.primary.soft,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  cardSub: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.background.default,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  terms: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  termsLink: {
    color: Colors.primary.main,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.lg,
  },
  footerMuted: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  linkText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
  },
});
