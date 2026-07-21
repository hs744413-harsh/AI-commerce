import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });

  const refresh = useCallback(async () => {
    if (!user) { setCart({ items: [], subtotal: 0, count: 0 }); return; }
    try {
      const r = await api.get("/cart");
      setCart(r.data);
    } catch { /* noop */ }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (product_id, quantity = 1) => {
    if (!user) { toast.error("Please sign in to add to cart"); return; }
    await api.post("/cart", { product_id, quantity });
    await refresh();
    toast.success("Added to cart");
  };
  const update = async (product_id, quantity) => {
    await api.patch(`/cart/${product_id}`, { product_id, quantity });
    await refresh();
  };
  const remove = async (product_id) => {
    await api.delete(`/cart/${product_id}`);
    await refresh();
  };

  return (
    <CartCtx.Provider value={{ cart, refresh, add, update, remove }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);