// src/types/admin.ts
// ⚠️ لا نعيد تصدير Profile و UserRole — موجودان في auth.ts
import type { Profile, UserRole } from "./auth";

export interface AdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
}

// ⬅️ AdminUser يستخدم Profile و UserRole من auth.ts
export interface AdminUser extends Profile {
  merchants?: { id: string; store_name: string } | null;
  drivers?: { id: string; vehicle_type: string } | null;
}

// ⬅️ إعادة تصدير صريحة (لا تعارض لأن auth.ts لم يصدّرها بعد بشكل مباشر)
export type { Profile, UserRole };
