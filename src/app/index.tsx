// src/app/index.tsx
import { useAuth } from "@/context/AuthContext";
import { useViewMode, ViewMode } from "@/context/ViewModeContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

function roleToMode(role: string | null): ViewMode {
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

export default function Index() {
  const { session, role, isLoading } = useAuth();
  const { viewMode, ready } = useViewMode();

  // انتظر الجلسة و viewMode
  if (isLoading || !ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  // غير مسجّل → login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // مسجّل → وجّه حسب الدور/الوضع
  const mode = viewMode ?? roleToMode(role);

  if (mode === "merchant") return <Redirect href="/(merchant)" />;
  if (mode === "driver") return <Redirect href="/(driver)" />;
  if (mode === "admin") return <Redirect href="/(admin)" />;
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
