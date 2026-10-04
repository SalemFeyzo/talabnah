// src/types/merchant.ts
import { Database } from "../../database.types";

export type Merchant = Database["public"]["Tables"]["merchants"]["Row"];
export type MerchantInsert =
  Database["public"]["Tables"]["merchants"]["Insert"];
export type MerchantUpdate =
  Database["public"]["Tables"]["merchants"]["Update"];

export interface CreateStoreInput {
  store_name: string;
  address?: string | null;
  logo_url?: string | null;
  category_id?: string | null;
}

export interface UpdateStoreInput {
  store_name?: string;
  address?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  category_id?: string | null;
}
