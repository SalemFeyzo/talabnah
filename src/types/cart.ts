// src/types/cart.ts
import { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  merchantId: string | null;
  merchantName: string | null;
  items: CartItem[];
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}
