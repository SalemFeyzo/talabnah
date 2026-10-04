// src/app/(auth)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { showAlert } from "@/utils/confirm";

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert("تنبيه", "أدخل البريد وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        showAlert("فشل الدخول", error.message);
        return;
      }
      // _layout.tsx سيتولى التوجيه
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر الدخول");
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
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="basket" size={56} color={Colors.gold.main} />
          </View>
          <Text style={styles.brand}>طلبناه</Text>
          <Text style={styles.brandLatin}>TALABNAH</Text>
          <Text style={styles.tagline}>كل احتياجاتك.. في مكان واحد</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>
          <Text style={styles.cardSub}>مرحباً بعودتك 👋</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={Colors.text.muted}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={Colors.text.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
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
                placeholder="••••••••"
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

          <Pressable
            onPress={() =>
              email.trim()
                ? showAlert("قريباً", "استعادة كلمة المرور قريباً")
                : showAlert("تنبيه", "أدخل البريد أولاً")
            }
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
          </Pressable>

          <AppButton
            label={loading ? "جاري الدخول..." : "دخول"}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            variant="primary"
            fullWidth
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.footer}>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={styles.linkText}>إنشاء حساب جديد</Text>
              </Pressable>
            </Link>
            <Text style={styles.footerMuted}>ليس لديك حساب؟</Text>
          </View>
        </View>

        <Text style={styles.bottomText}>طلبناه — معك في كل طريق 🛒</Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: Spacing.xxl },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.gold.main,
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  brand: {
    fontSize: 34,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold.main,
    letterSpacing: 1,
  },
  brandLatin: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.gold.light,
    letterSpacing: 6,
    marginTop: -4,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.primary.soft,
    marginTop: Spacing.sm,
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
  forgot: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: Spacing.sm,
  },
  forgotText: {
    fontSize: FontSize.xs,
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
  bottomText: {
    fontSize: FontSize.xs,
    color: Colors.primary.soft,
    marginTop: Spacing.xl,
    textAlign: "center",
    opacity: 0.8,
  },
});
