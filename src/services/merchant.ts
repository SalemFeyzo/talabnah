// src/services/merchant.ts
import type { CreateStoreInput, Merchant, UpdateStoreInput } from "@/types";
import { supabase } from "@/utils/supabase";

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
   * جلب جميع المتاجر النشطة (للعميل)
   */
  async listActive(): Promise<Merchant[]> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing active merchants:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * جلب متجر معيّن بالمعرّف (للعميل)
   */
  async getById(id: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching merchant by id:", error);
      throw error;
    }

    return data;
  },

  /**
   * متاجر قسم معيّن
   */
  async listByCategory(categoryId: string): Promise<Merchant[]> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing merchants by category:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * تحويل العميل إلى تاجر / إنشاء أو تحديث المتجر
   * - إن وُجد متجر سابق → حدّثه (لا تفشل)
   * - إن لم يوجد → أنشئ جديد
   * - في كل الحالات → تأكد أن role = MERCHANT
   */
  async convertClientToMerchant(
    userId: string,
    storeData: CreateStoreInput,
  ): Promise<Merchant> {
    // 1. هل يوجد متجر سابق لهذا المستخدم؟
    const { data: existing } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    let store: Merchant;

    if (existing) {
      // ✅ تحديث المتجر الموجود
      const { data, error } = await supabase
        .from("merchants")
        .update({
          store_name: storeData.store_name,
          address: storeData.address ?? null,
          logo_url: storeData.logo_url ?? existing.logo_url,
          category_id: storeData.category_id ?? existing.category_id,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating merchant:", error);
        throw error;
      }
      store = data;
    } else {
      // ✅ إنشاء جديد
      const { data, error } = await supabase
        .from("merchants")
        .insert({
          owner_id: userId,
          store_name: storeData.store_name,
          address: storeData.address ?? null,
          logo_url: storeData.logo_url ?? null,
          category_id: storeData.category_id ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating merchant:", error);
        throw error;
      }
      store = data;
    }

    // 2. تحديث الدور (في كل الحالات — حتى لو كان MERCHANT مسبقاً)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "MERCHANT" })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating role:", profileError);
      throw profileError;
    }

    return store;
  },

  /**
   * Alias للتوافق مع كود قديم
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
    const { data, error } = await supabase
      .from("merchants")
      .update(updates)
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
   * تفعيل/تعطيل المتجر
   */
  async toggleActive(merchantId: string, current: boolean): Promise<Merchant> {
    return this.updateStore(merchantId, { is_active: !current });
  },

  // أضف داخل merchantService (قبل الإغلاق)

  /**
   * ترقية المستخدم إلى MERCHANT (يُستدعى عند التبديل للتاجر)
   */
  async promoteToMerchant(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "MERCHANT" })
      .eq("id", userId);
    if (error) {
      console.error("Error promoting to merchant:", error);
      throw error;
    }
  },

  /**
   * إرجاع المستخدم إلى CLIENT (يُستدعى عند التبديل للعميل)
   * ⚠️ ملاحظة: المتجر يبقى موجوداً، فقط الواجهة تتغير
   */
  async demoteToClient(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "CLIENT" })
      .eq("id", userId);
    if (error) {
      console.error("Error demoting to client:", error);
      throw error;
    }
  },
};
