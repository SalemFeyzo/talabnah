// src/constants/colors.ts
// نظام الألوان المستخرج من هوية طلبناه

export const Colors = {
  // ============ الألوان الأساسية ============
  primary: {
    main: "#1B4332", // الأخضر الأساسي (Header, Buttons)
    dark: "#0D2B1F", // الأخضر الداكن (Splash, Hero)
    light: "#2D6A4F", // الأخضر الفاتح (Hover, Borders)
    soft: "#D8F3DC", // الأخضر الناعم (Backgrounds, Badges)
  },

  // ============ الذهبي (Accent) ============
  gold: {
    main: "#D4A24C", // الذهبي الأساسي (CTAs الثانوية، الأسعار)
    dark: "#B8862E", // Hover
    light: "#E8C77B", // فاتح
    soft: "#FDF6E3", // خلفية ناعمة
  },

  // ============ الخلفيات ============
  background: {
    default: "#FAF8F0", // خلفية الشاشات العامة
    paper: "#FFFFFF", // البطاقات
    subtle: "#F5F3E8", // تدرج ناعم
    dark: "#0D2B1F", // خلفيات داكنة
  },

  // ============ النصوص ============
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    muted: "#94A3B8",
    inverse: "#FFFFFF",
    gold: "#D4A24C",
  },

  // ============ الحالات ============
  status: {
    success: "#16A34A",
    successSoft: "#DCFCE7",
    warning: "#F59E0B",
    warningSoft: "#FEF3C7",
    error: "#DC2626",
    errorSoft: "#FEE2E2",
    info: "#0284C7",
    infoSoft: "#E0F2FE",
  },

  // ============ الحواف والفواصل ============
  border: {
    light: "#F1F5F9",
    default: "#E2E8F0",
    dark: "#CBD5E1",
  },

  // ============ الرمادي ============
  gray: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  // ============ أدوات ============
  overlay: "rgba(15, 23, 42, 0.5)",
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",
} as const;

// ============ حالات الطلب ============
export const OrderStatusColors = {
  PENDING: {
    bg: Colors.status.warningSoft,
    text: Colors.status.warning,
    label: "قيد الانتظار",
  },
  PREPARING: {
    bg: Colors.status.infoSoft,
    text: Colors.status.info,
    label: "قيد التحضير",
  },
  READY: {
    bg: Colors.gold.soft,
    text: Colors.gold.dark,
    label: "جاهز للاستلام",
  },
  ON_THE_WAY: {
    bg: Colors.primary.soft,
    text: Colors.primary.main,
    label: "في الطريق",
  },
  DELIVERED: {
    bg: Colors.status.successSoft,
    text: Colors.status.success,
    label: "تم التسليم",
  },
  CANCELLED: {
    bg: Colors.status.errorSoft,
    text: Colors.status.error,
    label: "ملغي",
  },
} as const;

export type OrderStatus = keyof typeof OrderStatusColors;
