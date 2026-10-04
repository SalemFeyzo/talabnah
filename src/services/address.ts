// src/services/address.ts
import type { Address, AddressInsert, AddressUpdate } from "@/types";
import { supabase } from "@/utils/supabase";

export const addressService = {
  async listMine(): Promise<Address[]> {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(input: AddressInsert): Promise<Address> {
    const { data, error } = await supabase
      .from("addresses")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: AddressUpdate): Promise<Address> {
    const { data, error } = await supabase
      .from("addresses")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) throw error;
  },

  async setDefault(id: string, clientId: string): Promise<void> {
    // إزالة الافتراضي من الكل
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("client_id", clientId);
    // تعيين الجديد
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  },
};
