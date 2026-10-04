// src/types/order.ts
import { Database } from "../../database.types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert =
  Database["public"]["Tables"]["order_items"]["Insert"];

export type OrderStatusHistory =
  Database["public"]["Tables"]["order_status_history"]["Row"];

/** طلب مع تفاصيله */
export interface OrderWithDetails extends Order {
  items?: OrderItem[];
  merchant?: {
    id: string;
    store_name: string;
    logo_url: string | null;
  };
  client?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

/** نموذج إنشاء طلب جديد */
export interface CreateOrderInput {
  merchant_id: string;
  address_id?: string | null;
  notes?: string | null;
  delivery_fee?: number;
  items: {
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
}
