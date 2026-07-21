import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function Checkout() {
  const { cart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ship, setShip] = useState({
    full_name: user?.name || "", line1: "", city: "", country: "", postal_code: "", phone: "",
  });

  const submit = async () => {
    for (const k of ["full_name", "line1", "city", "country", "postal_code", "phone"]) {
      if (!ship[k]) { toast.error("Please complete all address fields"); return; }
    }
    setLoading(true);
    try {
      const origin_url = window.location.origin;
      const r = await api.post("/orders/checkout", { shipping: ship, origin_url });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error("Checkout failed");
      setLoading(false);
    }
  };

  if (!user) return <div className="p-16 text-center text-neutral-600">Please sign in to checkout.</div>;

  return (
    <div data-testid="checkout-page" className="mx-auto max-w-[1200px] px-6 lg:px-12 py-16">
      <h1 className="font-serif text-5xl tracking-tighter font-light mb-12">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Shipping Address</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["full_name", "Full name", "col-span-2"],
              ["line1", "Street address", "col-span-2"],
              ["city", "City", ""],
              ["postal_code", "Postal code", ""],
              ["country", "Country", ""],
              ["phone", "Phone", ""],
            ].map(([k, label, span]) => (
              <div key={k} className={span}>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">{label}</label>
                <input
                  data-testid={`ship-${k}`}
                  value={ship[k]}
                  onChange={(e) => setShip({ ...ship, [k]: e.target.value })}
                  className="w-full border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none transition-colors duration-200"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="border border-neutral-200 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Order Summary</div>
            {cart.items.map((it) => (
              <div key={it.product_id} className="flex justify-between text-sm py-2">
                <span className="truncate">{it.product.name} × {it.quantity}</span>
                <span>${it.line_total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-medium border-t border-neutral-200 pt-4 mt-4">
              <span>Total</span><span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <button
              data-testid="pay-button"
              onClick={submit}
              disabled={loading || cart.items.length === 0}
              className="mt-6 w-full font-mono text-[11px] uppercase tracking-[0.2em] py-3 bg-[#002FA7] hover:bg-[#002280] text-white disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? "Redirecting…" : "Pay with Stripe"}
            </button>
            <div className="mt-3 text-[10px] text-neutral-500 font-mono">Test mode. Use card 4242 4242 4242 4242.</div>
          </div>
        </div>
      </div>
    </div>
  );
}