// src/constants/spacing.ts

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

/**
 * Shadows — تستخدم boxShadow (مدعوم على الويب + iOS + Android مع New Architecture)
 * التنسيق: "offsetX offsetY blurRadius spreadRadius color"
 */
export const Shadow = {
  none: {
    boxShadow: "0px 0px 0px rgba(0,0,0,0)",
  },
  sm: {
    boxShadow: "0px 1px 3px rgba(0,0,0,0.05)",
  },
  md: {
    boxShadow: "0px 2px 6px rgba(0,0,0,0.08)",
  },
  lg: {
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
} as const;

export const Layout = {
  maxContentWidth: 1200,
  maxFormWidth: 480,
  headerHeight: 60,
  tabBarHeight: 64,
} as const;
