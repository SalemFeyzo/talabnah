// src/types/driver.ts
import { Database } from "../../database.types";

export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];
export type DriverUpdate = Database["public"]["Tables"]["drivers"]["Update"];

export interface RegisterDriverInput {
  vehicle_type: string;
  license_plate?: string | null;
}

export interface DriverStats {
  todayOrders: number;
  todayEarnings: number;
  totalDelivered: number;
  rating: number;
}
