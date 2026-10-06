// src/app/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useViewMode, ViewMode } from "@/context/ViewModeContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

function roleToMode(role: string | null): ViewMode {
  switch (role) {
    case "MERCHANT":
      return "merchant";
    case "DRIVER":
      return "driver";
    case "ADMIN":
    case "SYSTEM_STAFF":
      return "admin";
    // ⭐ MERCHANT_STAFF → client افتراضياً
    default:
      return "client";
  }
}

function isViewModeAllowed(mode: ViewMode, role: string | null): boolean {
  // الأدمن: كل الأوضاع
  if (role === "ADMIN" || role === "SYSTEM_STAFF") return true;
  // التاجر: merchant + client
  if (role === "MERCHANT") {
    return mode === "merchant" || mode === "client";
  }
  // موظف المتجر: merchant + client
  if (role === "MERCHANT_STAFF") {
    return mode === "merchant" || mode === "client";
  }
  // الكابتن: driver + client
  if (role === "DRIVER") {
    return mode === "driver" || mode === "client";
  }
  // العميل
  return mode === "client";
}

export default function Index() {
  const { session, role, isLoading } = useAuth();
  const { viewMode, ready } = useViewMode();

  if (isLoading || !ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  // الأدمن دائماً
  if (role === "ADMIN" || role === "SYSTEM_STAFF") {
    return <Redirect href="/(admin)" />;
  }

  const defaultMode = roleToMode(role);
  const effectiveMode =
    viewMode && isViewModeAllowed(viewMode, role) ? viewMode : defaultMode;

  if (effectiveMode === "merchant") return <Redirect href="/(merchant)" />;
  if (effectiveMode === "driver") return <Redirect href="/(driver)" />;
  return <Redirect href="/(client)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F0",
  },
});
