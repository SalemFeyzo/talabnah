// src/services/product.ts
import type { Category, Product, ProductInsert, ProductUpdate } from "@/types";
import { supabase } from "@/utils/supabase";

export const productService = {
  // ==================================================
  // الأقسام
  // ==================================================

  /**
   * جلب جميع الأقسام (مرتبة)
   */
  async listCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error listing categories:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * جلب قسم معيّن بالمعرّف
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching category:", error);
      throw error;
    }

    return data;
  },

  // ==================================================
  // المنتجات — للعميل
  // ==================================================

  /**
   * منتجات متوفرة فقط (للعميل)
   */
  async listAvailable(limit = 50): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error listing available products:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * منتجات مميزة / حديثة (لصفحة الرئيسية)
   */
  async listPopular(limit = 20): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error listing popular products:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * منتجات قسم معيّن (متوفرة فقط)
   */
  async listByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing products by category:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * منتجات متجر معيّن (متوفرة فقط — للعميل)
   */
  async listByMerchant(merchantId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing merchant products:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * منتجات متجر معيّن (كل الحالات — للتاجر)
   */
  async listAllByMerchant(merchantId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing all merchant products:", error);
      throw error;
    }

    return data ?? [];
  },

  /**
   * منتج واحد بالمعرّف
   */
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      throw error;
    }

    return data;
  },

  /**
   * بحث بالاسم
   */
  async search(term: string, limit = 30): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_available", true)
      .ilike("name", `%${term}%`)
      .limit(limit);

    if (error) {
      console.error("Error searching products:", error);
      throw error;
    }

    return data ?? [];
  },

  // ==================================================
  // المنتجات — للتاجر (CRUD)
  // ==================================================

  /**
   * إضافة منتج جديد
   */
  async create(input: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }

    return data;
  },

  /**
   * تعديل منتج
   */
  async update(id: string, patch: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }

    return data;
  },

  /**
   * تبديل حالة التوفر
   */
  async toggleAvailable(id: string, current: boolean): Promise<Product> {
    return this.update(id, { is_available: !current });
  },

  /**
   * حذف منتج
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },
};
