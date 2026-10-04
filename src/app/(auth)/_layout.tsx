// src/app/(auth)/_layout.tsx
import { useAuth } from "@/context/AuthContext";
import { useViewMode, ViewMode } from "@/context/ViewModeContext";
import { Redirect, Stack } from "expo-router";

/**
 * تحويل role إلى view mode افتراضي
 */
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

/**
 * هل هذا الـ viewMode مسموح لهذا الـ role؟
 * - ADMIN: يستطيع الوصول لأي وضع
 * - MERCHANT: يستطيع الوصول لـ merchant أو client
 * - DRIVER: يستطيع الوصول لـ driver أو client
 * - CLIENT: يستطيع الوصول لـ client فقط (أو merchant إذا أنشأ متجراً)
 */
function isViewModeAllowed(mode: ViewMode, role: string | null): boolean {
  if (role === "ADMIN" || role === "SYSTEM_STAFF") return true;

  if (role === "MERCHANT" || role === "MERCHANT_STAFF") {
    return mode === "merchant" || mode === "client";
  }

  if (role === "DRIVER") {
    return mode === "driver" || mode === "client";
  }

  // CLIENT افتراضي
  return mode === "client" || mode === "merchant";
}

export default function AuthLayout() {
  const { session, role } = useAuth();
  const { viewMode, ready } = useViewMode();

  // انتظر تحميل viewMode من التخزين قبل أي قرار
  if (session && ready) {
    const defaultMode = roleToMode(role);

    // احترم viewMode فقط إذا كان مسموحاً
    const effectiveMode =
      viewMode && isViewModeAllowed(viewMode, role) ? viewMode : defaultMode;

    if (effectiveMode === "merchant") return <Redirect href="/(merchant)" />;
    if (effectiveMode === "driver") return <Redirect href="/(driver)" />;
    if (effectiveMode === "admin") return <Redirect href="/(admin)" />;
    return <Redirect href="/(client)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
