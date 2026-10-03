// src/services/merchant.ts
import { UserRole } from "@/types/auth";
import { supabase } from "@/utils/supabase";

// Types & Interfaces للمتاجر
export interface Merchant {
  id: string;
  owner_id: string;
  store_name: string;
  address?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStoreInput {
  store_name: string;
  address?: string | null;
}

export interface UpdateStoreInput {
  store_name?: string;
  address?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

// Types & Interfaces للمنتجات
export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductInsert {
  merchant_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available?: boolean;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
  price?: number;
  image_url?: string | null;
  is_available?: boolean;
}

export const merchantService = {
  /**
   * جلب بيانات متجر التاجر الحالي بواسطة id المستخدم (owner_id)
   */
  async getMyMerchant(userId: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching merchant:", error);
      throw error;
    }

    return data;
  },

  /**
   * تحويل العميل إلى تاجر / إنشاء متجر جديد:
   * 1. إنشاء متجر جديد في جدول merchants
   * 2. تحديث دور المستخدم (role) في جدول profiles إلى MERCHANT
   */
  async convertClientToMerchant(
    userId: string,
    storeData: CreateStoreInput,
  ): Promise<Merchant> {
    // 1. إنشاء سجل المتجر
    const { data: store, error: storeError } = await supabase
      .from("merchants")
      .insert({
        owner_id: userId,
        store_name: storeData.store_name,
        address: storeData.address || null,
        is_active: true,
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error creating merchant store:", storeError);
      throw storeError;
    }

    // 2. تحديث دور البروفايل في profiles
    const merchantRole: UserRole = "MERCHANT" as UserRole;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: merchantRole })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating user role to MERCHANT:", profileError);
      throw profileError;
    }

    return store;
  },

  /**
   * اسم بديل (Alias) لدعم الاستدعاء باسم createMerchant
   */
  async createMerchant(
    userId: string,
    storeData: CreateStoreInput,
  ): Promise<Merchant> {
    return this.convertClientToMerchant(userId, storeData);
  },

  /**
   * تحديث بيانات المتجر الحالي
   */
  async updateStore(
    merchantId: string,
    updates: UpdateStoreInput,
  ): Promise<Merchant> {
    const payload: UpdateStoreInput & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (updates.store_name !== undefined)
      payload.store_name = updates.store_name;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.logo_url !== undefined) payload.logo_url = updates.logo_url;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;

    const { data, error } = await supabase
      .from("merchants")
      .update(payload)
      .eq("id", merchantId)
      .select()
      .single();

    if (error) {
      console.error("Error updating merchant store:", error);
      throw error;
    }

    return data;
  },

  /**
   * جلب جميع منتجات متجر محدد
   */
  async getProducts(merchantId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching merchant products:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * إضافة منتج جديد
   */
  async createProduct(productData: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }

    return data;
  },

  /**
   * تحديث بيانات منتج معين
   */
  async updateProduct(
    productId: string,
    updates: ProductUpdate,
  ): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }

    return data;
  },

  /**
   * تبديل حالة توفر المنتج (متاح / غير متاح)
   */
  async toggleProductAvailability(
    productId: string,
    currentStatus: boolean,
  ): Promise<Product> {
    return this.updateProduct(productId, { is_available: !currentStatus });
  },

  /**
   * حذف منتج
   */
  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  /**
   * جلب طلبات المتجر
   */
  async getOrders(merchantId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles:client_id(full_name, phone)")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching merchant orders:", error);
      throw error;
    }

    return data || [];
  },
};
