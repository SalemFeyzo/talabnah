// src/hooks/use-responsive.ts
import { Platform, useWindowDimensions } from "react-native";

export type DeviceType = "mobile" | "tablet" | "desktop";

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const device: DeviceType =
    width >= BREAKPOINTS.desktop
      ? "desktop"
      : width >= BREAKPOINTS.tablet
        ? "tablet"
        : "mobile";

  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const isDesktop = device === "desktop";
  const isWeb = Platform.OS === "web";

  // عدد الأعمدة للشبكة (products, stores...)
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  // عرض البطاقة في الشبكة (تقديري)
  const cardWidth = (Math.min(width, 1200) - 48) / gridColumns;

  return {
    width,
    height,
    device,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    gridColumns,
    cardWidth,
  };
}
