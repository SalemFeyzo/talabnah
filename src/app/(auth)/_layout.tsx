// src/app/(auth)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { useViewMode, ViewMode } from "@/context/ViewModeContext";
import { Redirect, Stack } from "expo-router";

function roleToMode(role: string | null): ViewMode {
  switch (role) {
    case "MERCHANT":
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

function isViewModeAllowed(mode: ViewMode, role: string | null): boolean {
  if (role === "ADMIN" || role === "SYSTEM_STAFF") return true;
  if (role === "MERCHANT" || role === "MERCHANT_STAFF") {
    return mode === "merchant" || mode === "client";
  }
  if (role === "DRIVER") {
    return mode === "driver" || mode === "client";
  }
  return mode === "client";
}

export default function AuthLayout() {
  const { session, role } = useAuth();
  const { viewMode, ready } = useViewMode();

  if (session && ready) {
    // الأدمن
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
