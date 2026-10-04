// src/context/CartContext.tsx
import { Product } from "@/types";
import { CartItem, CartTotals } from "@/types/cart";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface CartContextValue {
  merchantId: string | null;
  merchantName: string | null;
  items: CartItem[];
  totals: CartTotals;
  addItem: (product: Product, merchantId: string, merchantName: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const DELIVERY_FEE = 0; // افتراضي — يمكن تخصيصه لاحقاً

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);

  const clearCart = useCallback(() => {
    setItems([]);
    setMerchantId(null);
    setMerchantName(null);
  }, []);

  const addItem = useCallback(
    (product: Product, mId: string, mName: string) => {
      // إذا أضاف من متجر آخر — نفرغ السلة
      if (merchantId && merchantId !== mId) {
        setItems([{ product, quantity: 1 }]);
        setMerchantId(mId);
        setMerchantName(mName);
        return;
      }

      setMerchantId(mId);
      setMerchantName(mName);

      setItems((prev) => {
        const existing = prev.find((it) => it.product.id === product.id);
        if (existing) {
          return prev.map((it) =>
            it.product.id === product.id
              ? { ...it, quantity: it.quantity + 1 }
              : it,
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    [merchantId],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.product.id !== productId);
      if (next.length === 0) {
        setMerchantId(null);
        setMerchantName(null);
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prev) =>
        prev.map((it) =>
          it.product.id === productId ? { ...it, quantity } : it,
        ),
      );
    },
    [removeItem],
  );

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.product.price) * it.quantity,
      0,
    );
    const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
    const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      itemCount,
    };
  }, [items]);

  const value: CartContextValue = {
    merchantId,
    merchantName,
    items,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount: totals.itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
