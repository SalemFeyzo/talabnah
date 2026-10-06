// src/services/driver.ts
import type {
  Driver,
  DriverStats,
  Order,
  OrderStatus,
  RegisterDriverInput,
} from "@/types";
import { supabase } from "@/utils/supabase";

export const driverService = {
  // ==================================================
  // بيانات الكابتن
  // ==================================================

  /**
   * جلب بيانات الكابتن الحالي
   */
  async getMyDriver(userId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching driver:", error);
      throw error;
    }
    return data;
  },

  /**
   * تسجيل كمندوب توصيل
   */
  async register(userId: string, input: RegisterDriverInput): Promise<Driver> {
    const { data, error } = await supabase
      .from("drivers")
      .insert({
        id: userId,
        vehicle_type: input.vehicle_type,
        license_plate: input.license_plate ?? null,
        is_approved: true, // MVP: موافقة تلقائية
      })
      .select()
      .single();

    if (error) {
      console.error("Error registering driver:", error);
      throw error;
    }

    // ترقية الدور
    const { error: roleErr } = await supabase
      .from("profiles")
      .update({ role: "DRIVER" })
      .eq("id", userId);

    if (roleErr) {
      console.error("Error promoting to driver:", roleErr);
      throw roleErr;
    }

    return data;
  },

  /**
   * تحديث بيانات المركبة
   */
  async updateDriver(
    userId: string,
    patch: Partial<RegisterDriverInput>,
  ): Promise<Driver> {
    const { data, error } = await supabase
      .from("drivers")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================================================
  // التبديل بين الأدوار
  // ==================================================

  /**
   * ترقية المستخدم إلى DRIVER (عند التبديل)
   */
  async promoteToDriver(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "DRIVER" })
      .eq("id", userId);
    if (error) throw error;
  },

  /**
   * إرجاع المستخدم إلى CLIENT
   */
  async demoteToClient(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "CLIENT" })
      .eq("id", userId);
    if (error) throw error;
  },

  // ==================================================
  // الطلبات
  // ==================================================

  /**
   * الطلبات المتاحة للكابتن (READY + غير معيّنة)
   */
  async listAvailableOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "READY")
      .is("driver_id", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * طلبات الكابتن (المعيّنة له)
   */
  async listMyOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * طلبات الكابتن الجارية (ON_THE_WAY)
   */
  async listActiveOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", driverId)
      .in("status", ["ON_THE_WAY"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * قبول طلب (تعيين driver_id + تغيير الحالة)
   */
  async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({
        driver_id: driverId,
        status: "ON_THE_WAY",
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * تحديث حالة الطلب
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * تفاصيل طلب كامل مع بيانات العميل + المتجر
   */
  async getOrderDetails(orderId: string): Promise<any | null> {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!order) return null;

    // العميل
    const { data: client } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", order.client_id)
      .maybeSingle();

    // المتجر
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id, store_name, address, logo_url")
      .eq("id", order.merchant_id)
      .maybeSingle();

    // العناصر
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    return {
      ...order,
      client,
      merchant,
      items: items ?? [],
    };
  },

  // ==================================================
  // الإحصائيات
  // ==================================================

  /**
   * إحصائيات الكابتن
   */
  async getStats(driverId: string): Promise<DriverStats> {
    const { data, error } = await supabase
      .from("orders")
      .select("status, delivery_fee, created_at")
      .eq("driver_id", driverId);

    if (error) throw error;

    const list = data ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayOrders = 0;
    let todayEarnings = 0;
    let totalDelivered = 0;

    for (const o of list) {
      if (o.status === "DELIVERED") {
        totalDelivered++;
        const fee = Number(o.delivery_fee) || 0;
        const created = new Date(o.created_at);
        if (created >= today) {
          todayOrders++;
          todayEarnings += fee;
        }
      }
    }

    return {
      todayOrders,
      todayEarnings,
      totalDelivered,
      rating: 4.8, // TODO: من نظام التقييمات لاحقاً
    };
  },

  // ==================================================
  // Realtime
  // ==================================================

  /**
   * الاشتراك في الطلبات المتاحة
   */
  subscribeAvailableOrders(onChange: () => void): () => void {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channelName = `available-orders-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=eq.READY",
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * الاشتراك في طلبات الكابتن
   */
  subscribeMyOrders(driverId: string, onChange: () => void): () => void {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channelName = `driver-orders-${driverId}-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `driver_id=eq.${driverId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
