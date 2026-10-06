// src/services/merchant.ts
import type { CreateStoreInput, Merchant, UpdateStoreInput } from "@/types";
import { supabase } from "@/utils/supabase";

export const merchantService = {
  // ==================================================
  // المتجر
  // ==================================================

  /**
   * جلب بيانات متجر التاجر الحالي (كمالك فقط)
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
   * جلب سياق المتجر: هل المستخدم مالك أم موظف؟
   * - إن كان مالكاً → يرجّع متجره
   * - إن كان موظفاً → يرجّع متجر صاحب العمل + صلاحياته
   */
  async getMyStoreContext(userId: string): Promise<{
    merchant: Merchant | null;
    isOwner: boolean;
    staff: {
      id: string;
      job_title: string;
      can_manage_products: boolean;
      can_manage_orders: boolean;
    } | null;
  }> {
    // 1. هل هو مالك؟
    const { data: ownedMerchant } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (ownedMerchant) {
      return { merchant: ownedMerchant, isOwner: true, staff: null };
    }

    // 2. هل هو موظف؟
    const { data: staffRow } = await supabase
      .from("merchant_staff")
      .select(
        "id, merchant_id, job_title, can_manage_products, can_manage_orders",
      )
      .eq("profile_id", userId)
      .maybeSingle();

    if (!staffRow) {
      return { merchant: null, isOwner: false, staff: null };
    }

    // 3. جلب المتجر
    const { data: merchant } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", staffRow.merchant_id)
      .maybeSingle();

    return {
      merchant: merchant ?? null,
      isOwner: false,
      staff: {
        id: staffRow.id,
        job_title: staffRow.job_title,
        can_manage_products: staffRow.can_manage_products,
        can_manage_orders: staffRow.can_manage_orders,
      },
    };
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
   * جلب متجر بالمعرّف
   */
  async getById(id: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
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

    if (error) throw error;
    return data ?? [];
  },

  /**
   * إنشاء متجر أو تحديثه + ترقية الدور إلى MERCHANT
   */
  async convertClientToMerchant(
    userId: string,
    storeData: CreateStoreInput,
  ): Promise<Merchant> {
    const { data: existing } = await supabase
      .from("merchants")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    let store: Merchant;

    if (existing) {
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

      if (error) throw error;
      store = data;
    } else {
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

      if (error) throw error;
      store = data;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "MERCHANT" })
      .eq("id", userId);

    if (profileError) throw profileError;
    return store;
  },

  /**
   * Alias للتوافق
   */
  async createMerchant(
    userId: string,
    storeData: CreateStoreInput,
  ): Promise<Merchant> {
    return this.convertClientToMerchant(userId, storeData);
  },

  /**
   * تحديث بيانات المتجر
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

    if (error) throw error;
    return data;
  },

  /**
   * تفعيل/تعطيل المتجر
   */
  async toggleActive(merchantId: string, current: boolean): Promise<Merchant> {
    return this.updateStore(merchantId, { is_active: !current });
  },

  /**
   * ترقية المستخدم إلى MERCHANT
   */
  async promoteToMerchant(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "MERCHANT" })
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
  // إدارة الموظفين
  // ==================================================

  /**
   * جلب موظفي متجر معيّن
   */
  async listStaff(merchantId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("merchant_staff")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const profileIds = data.map((s) => s.profile_id);
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .in("id", profileIds);

    if (profErr) throw profErr;

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    return data.map((s) => ({
      ...s,
      profile: profileMap.get(s.profile_id) ?? null,
    }));
  },

  /**
   * البحث عن مستخدم بالهاتف (عبر RPC — يتجاوز RLS)
   */
  async findUserByPhone(phone: string): Promise<{
    found: boolean;
    profile?: {
      id: string;
      full_name: string;
      phone: string;
      role: string;
    };
    suggestions?: { full_name: string; phone: string }[];
  }> {
    const cleanInput = phone.replace(/[\s\-()]/g, "").trim();
    if (!cleanInput) {
      return { found: false };
    }

    // توليد صيغ متعددة
    const variants = new Set<string>();
    variants.add(cleanInput);

    if (cleanInput.startsWith("+963")) {
      variants.add("0" + cleanInput.slice(4));
      variants.add(cleanInput.slice(4));
    }
    if (cleanInput.startsWith("963") && !cleanInput.startsWith("+963")) {
      variants.add("0" + cleanInput.slice(3));
      variants.add(cleanInput.slice(3));
    }
    if (cleanInput.startsWith("0")) {
      variants.add("+963" + cleanInput.slice(1));
      variants.add("963" + cleanInput.slice(1));
      variants.add(cleanInput.slice(1));
    }

    const variantsArray = Array.from(variants);
    console.log("🔍 البحث عن صيغ:", variantsArray);

    // ✅ استدعاء RPC
    const { data, error } = await supabase.rpc("find_user_by_phone", {
      phone_variants: variantsArray,
    });

    if (error) {
      console.error("RPC find_user_by_phone error:", error);
      throw error;
    }

    // RPC يُرجع مصفوفة
    const profile = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (profile) {
      return {
        found: true,
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role,
        },
      };
    }

    // اقتراحات
    const searchTerm = cleanInput.slice(-6);
    const { data: suggestions } = await supabase.rpc(
      "suggest_users_by_phone_suffix",
      { suffix: searchTerm },
    );

    const suggestionsArray: { full_name: string; phone: string }[] =
      Array.isArray(suggestions) ? suggestions : [];

    return {
      found: false,
      suggestions: suggestionsArray,
    };
  },

  /**
   * إضافة موظف مع تحقق شامل + استخدام RPC لتغيير الدور
   */
  async addStaff(input: {
    merchant_id: string;
    phone: string;
    job_title: string;
    can_manage_products: boolean;
    can_manage_orders: boolean;
  }): Promise<any> {
    const cleanInput = input.phone.replace(/[\s\-()]/g, "").trim();
    if (!cleanInput) {
      throw new Error("رقم الهاتف غير صالح");
    }

    // 1. ابحث عن المستخدم
    const searchResult = await this.findUserByPhone(cleanInput);

    if (!searchResult.found || !searchResult.profile) {
      let message = "لا يوجد مستخدم مسجّل بهذا الرقم.";
      if (searchResult.suggestions && searchResult.suggestions.length > 0) {
        message += "\n\nهل تقصد أحد هؤلاء؟\n";
        message += searchResult.suggestions
          .map((s) => `• ${s.full_name} — ${s.phone}`)
          .join("\n");
      } else {
        message += "\n\nتأكد من أن المستخدم أنشأ حساباً في طلبناه كعميل أولاً.";
      }
      throw new Error(message);
    }

    const profile = searchResult.profile;

    // 2. تحقق من الدور
    if (profile.role === "ADMIN" || profile.role === "SYSTEM_STAFF") {
      throw new Error("لا يمكن إضافة أدمن أو موظف نظام كموظف متجر");
    }
    if (profile.role === "MERCHANT") {
      throw new Error("لا يمكن إضافة صاحب متجر آخر كموظف");
    }
    if (profile.role === "DRIVER") {
      throw new Error("لا يمكن إضافة كابتن توصيل كموظف متجر");
    }

    // 3. تحقق من عدم وجوده كموظف في أي متجر
    const { data: existingStaff } = await supabase
      .from("merchant_staff")
      .select("id, merchant_id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existingStaff) {
      if (existingStaff.merchant_id === input.merchant_id) {
        throw new Error("هذا المستخدم موظف في متجرك بالفعل");
      }
      throw new Error("هذا المستخدم موظف في متجر آخر بالفعل");
    }

    // 4. أضف الموظف في merchant_staff
    const { data: staff, error: staffErr } = await supabase
      .from("merchant_staff")
      .insert({
        merchant_id: input.merchant_id,
        profile_id: profile.id,
        job_title: input.job_title,
        can_manage_products: input.can_manage_products,
        can_manage_orders: input.can_manage_orders,
      })
      .select()
      .single();

    if (staffErr) {
      if (staffErr.code === "23505") {
        throw new Error("هذا المستخدم موظف بالفعل");
      }
      throw staffErr;
    }

    // 5. غيّر الدور إلى MERCHANT_STAFF عبر RPC
    const { error: roleErr } = await supabase.rpc("set_user_role", {
      target_user_id: profile.id,
      new_role: "MERCHANT_STAFF",
    });

    if (roleErr) {
      // Rollback
      await supabase.from("merchant_staff").delete().eq("id", staff.id);
      throw roleErr;
    }

    return {
      ...staff,
      profile: { ...profile, role: "MERCHANT_STAFF" },
    };
  },

  /**
   * تحديث صلاحيات موظف
   */
  async updateStaff(
    staffId: string,
    patch: {
      job_title?: string;
      can_manage_products?: boolean;
      can_manage_orders?: boolean;
    },
  ): Promise<any> {
    const { data, error } = await supabase
      .from("merchant_staff")
      .update(patch)
      .eq("id", staffId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * حذف موظف + إرجاع دوره إلى CLIENT عبر RPC
   */
  async removeStaff(staffId: string): Promise<void> {
    // 1. اجلب معلومات الموظف
    const { data: staff, error: fetchErr } = await supabase
      .from("merchant_staff")
      .select("profile_id")
      .eq("id", staffId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!staff) throw new Error("الموظف غير موجود");

    // 2. احذف السجل
    const { error: deleteErr } = await supabase
      .from("merchant_staff")
      .delete()
      .eq("id", staffId);

    if (deleteErr) throw deleteErr;

    // 3. أرجعه إلى CLIENT عبر RPC
    const { error: roleErr } = await supabase.rpc("set_user_role", {
      target_user_id: staff.profile_id,
      new_role: "CLIENT",
    });

    if (roleErr) {
      console.error("Error resetting role:", roleErr);
    }
  },
};
