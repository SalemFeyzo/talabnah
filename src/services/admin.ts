// src/services/admin.ts
import type {
  AdminStats,
  AdminUser,
  Category,
  Merchant,
  Order,
  UserRole,
} from "@/types";
import { supabase } from "@/utils/supabase";

export const adminService = {
  // ==================================================
  // الإحصائيات
  // ==================================================
  async getStats(): Promise<AdminStats> {
    const [
      { count: usersCount },
      { count: merchantsCount },
      { count: driversCount },
      { data: orders },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("merchants").select("*", { count: "exact", head: true }),
      supabase.from("drivers").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("status, total_amount, created_at"),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let pendingOrders = 0;

    for (const o of orders ?? []) {
      const amount = Number(o.total_amount) || 0;
      const created = new Date(o.created_at);
      const isToday = created >= today;
      const isCancelled = o.status === "CANCELLED";

      if (!isCancelled) {
        totalRevenue += amount;
        if (isToday) {
          todayOrders++;
          todayRevenue += amount;
        }
      }

      if (o.status === "PENDING" || o.status === "PREPARING") {
        pendingOrders++;
      }
    }

    return {
      totalUsers: usersCount ?? 0,
      totalMerchants: merchantsCount ?? 0,
      totalDrivers: driversCount ?? 0,
      totalOrders: orders?.length ?? 0,
      totalRevenue,
      todayOrders,
      todayRevenue,
      pendingOrders,
    };
  },

  // ==================================================
  // المستخدمون
  // ==================================================
  async listUsers(limit = 100): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async searchUsers(term: string): Promise<AdminUser[]> {
    const q = `%${term}%`;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`full_name.ilike.${q},phone.ilike.${q}`)
      .limit(50);

    if (error) throw error;
    return data ?? [];
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) throw error;
  },

  // ==================================================
  // المتاجر
  // ==================================================
  async listMerchants(): Promise<Merchant[]> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async toggleMerchantActive(
    merchantId: string,
    current: boolean,
  ): Promise<Merchant> {
    const { data, error } = await supabase
      .from("merchants")
      .update({ is_active: !current })
      .eq("id", merchantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==================================================
  // الطلبات
  // ==================================================
  async listAllOrders(limit = 100): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  // ==================================================
  // الأقسام
  // ==================================================
  async listCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async createCategory(input: {
    name: string;
    icon?: string | null;
    sort_order?: number;
  }): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: input.name,
        icon: input.icon ?? null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCategory(
    id: string,
    patch: { name?: string; icon?: string | null; sort_order?: number },
  ): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  // ==================================================
  // Realtime
  // ==================================================
  subscribeAllOrders(onChange: () => void): () => void {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channelName = `admin-all-orders-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
