// src/services/order.ts
import type {
  CreateOrderInput,
  Order,
  OrderStatus,
  OrderWithDetails,
} from "@/types";
import { supabase } from "@/utils/supabase";

export const orderService = {
  /**
   * إنشاء طلب + عناصره
   */
  async create(input: CreateOrderInput): Promise<Order> {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) throw new Error("يجب تسجيل الدخول أولاً");

    const subtotal = input.items.reduce(
      (sum, it) => sum + it.unit_price * it.quantity,
      0,
    );
    const deliveryFee = input.delivery_fee ?? 0;
    const total = subtotal + deliveryFee;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        client_id: user.id,
        merchant_id: input.merchant_id,
        address_id: input.address_id ?? null,
        notes: input.notes ?? null,
        delivery_fee: deliveryFee,
        total_amount: total,
        status: "PENDING",
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase.from("order_items").insert(
      input.items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: it.unit_price,
        quantity: it.quantity,
      })),
    );
    if (itemsErr) throw itemsErr;

    return order;
  },

  /**
   * طلبات العميل الحالي
   */
  async listMine(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * طلبات متجر (للتاجر)
   */
  async listByMerchant(merchantId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * تفاصيل طلب مع عناصره (للعميل)
   */
  async getById(id: string): Promise<OrderWithDetails | null> {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return null;

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    return { ...order, items: items ?? [] };
  },

  /**
   * تحديث حالة الطلب
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * تحديث حالة الطلب وإرجاع الطلب المحدث
   */
  async updateStatusAndReturn(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * إحصائيات طلبات المتجر (للوحة التاجر)
   */
  async getMerchantStats(merchantId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    const { data, error } = await supabase
      .from("orders")
      .select("status, total_amount, created_at")
      .eq("merchant_id", merchantId);

    if (error) throw error;

    const list = data ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;

    for (const o of list) {
      const amount = Number(o.total_amount) || 0;
      const created = new Date(o.created_at);
      const isToday = created >= today;

      if (o.status !== "CANCELLED") {
        totalOrders++;
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
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
    };
  },

  /**
   * طلبات متجر معيّن (alias مع تفاصيل إضافية)
   */
  async listMerchantOrders(merchantId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * جلب طلب كامل مع بيانات العميل (للتاجر)
   */
  async getMerchantOrderDetails(id: string): Promise<any | null> {
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!order) return null;

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", order.client_id)
      .maybeSingle();

    return {
      ...order,
      items: items ?? [],
      client: profile,
    };
  },

  /**
   * Realtime subscription على طلبات متجر معيّن
   * - اسم قناة فريد لتفادي التعارض (StrictMode + إعادة استخدام)
   * - ينظّف تلقائياً عند unmount
   */
  subscribeMerchantOrders(
    merchantId: string,
    onChange: () => void,
  ): () => void {
    // اسم فريد لكل subscription
    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const channelName = `merchant-orders-${merchantId}-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
