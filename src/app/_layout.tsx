// src/app/_layout.tsx
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ViewModeProvider, useViewMode } from "@/context/ViewModeContext";
import { Slot, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

function RootLayoutNav() {
  const { session, role, isLoading } = useAuth();
  const { viewMode, ready } = useViewMode();
  const router = useRouter();
  const navState = useRootNavigationState();

  // تذكّر آخر "توجيه" تم (session + role)
  const lastRoutedKey = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !ready) return;
    if (!navState?.key) return;

    // ⭐ انتظر تحميل profile إذا فيه session (role === null يعني لم يُحمَّل بعد)
    if (session && role === null) return;

    // المفتاح: session + role
    const key = `${session?.user?.id ?? "no-session"}_${role ?? "no-role"}`;
    if (lastRoutedKey.current === key) return;
    lastRoutedKey.current = key;

    // 1. لا session → login
    if (!session) {
      router.replace("/(auth)/login");
      return;
    }

    // 2. الأدمن دائماً للأدمن
    if (role === "ADMIN" || role === "SYSTEM_STAFF") {
      router.replace("/(admin)");
      return;
    }

    // 3. باقي الأدوار حسب role/viewMode
    const mode = viewMode ?? roleToViewMode(role);
    router.replace(viewModeToRoute(mode));
  }, [session, role, viewMode, isLoading, ready, navState?.key, router]);

  if (isLoading || !ready || !navState?.key) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return <Slot />;
}

function roleToViewMode(role: string | null): string {
  switch (role) {
    case "MERCHANT":
    case "MERCHANT_STAFF":
      return "merchant";
    case "DRIVER":
      return "driver";
    case "ADMIN":
    case "SYSTEM_STAFF":
      return "admin";
    default:
      return "client";
  }
}

function viewModeToRoute(
  mode: string,
): "/(client)" | "/(merchant)" | "/(driver)" | "/(admin)" {
  switch (mode) {
    case "merchant":
      return "/(merchant)";
    case "driver":
      return "/(driver)";
    case "admin":
      return "/(admin)";
    default:
      return "/(client)";
  }
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ViewModeProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </ViewModeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F0",
  },
});
