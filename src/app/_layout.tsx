import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "../global.css";

function RootLayoutNav() {
  const { session, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === "(auth)";

    console.log("📌 حالة الجلسة الحالية:", {
      hasSession: !!session,
      userId: session?.user?.id,
      role: role,
      currentSegment: firstSegment,
    });

    // 1. إذا لم تكن هناك جلسة ومستخدم ليس بداخل مجموعة (auth)
    if (!session) {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    // 2. إذا كان المستخدم مسجلاً ودخل إلى (auth) أو الصفحة الرئيسية
    if (inAuthGroup || !firstSegment || firstSegment === "index") {
      const userRole = role || "CLIENT"; // اعتماد CLIENT كخيار افتراضي عند تأخر جلب الملف الشخصي

      switch (userRole) {
        case "DRIVER":
          router.replace("/(driver)");
          break;
        case "MERCHANT":
        case "MERCHANT_STAFF":
          router.replace("/(merchant)");
          break;
        case "SYSTEM_STAFF":
        case "ADMIN":
          router.replace("/(admin)");
          break;
        case "CLIENT":
        default:
          router.replace("/(client)");
          break;
      }
    }
  }, [session, role, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
