import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Trash2 } from "lucide-react";

export default function Cart() {
  const { cart, update, remove } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl font-light mb-4">Your cart</h1>
        <p className="text-neutral-600">Please sign in to view your cart.</p>
      </div>
    );
  }

  return (
    <div data-testid="cart-page" className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16">
      <h1 className="font-serif text-5xl tracking-tighter font-light mb-12">Cart</h1>
      {cart.items.length === 0 ? (
        <div className="text-neutral-500">
          Your cart is empty. <Link to="/products" className="underline">Continue shopping</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 divide-y divide-neutral-200">
            {cart.items.map((it) => (
              <div key={it.product_id} data-testid={`cart-item-${it.product_id}`} className="flex gap-6 py-6">
                <img src={it.product.image_url} alt="" className="w-28 h-32 object-cover" />
                <div className="flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{it.product.brand}</div>
                  <Link to={`/products/${it.product_id}`} className="text-neutral-900 hover:underline">{it.product.name}</Link>
                  <div className="text-neutral-600 text-sm mt-1">${it.product.price.toFixed(2)}</div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center border border-neutral-300">
                      <button data-testid={`cart-dec-${it.product_id}`} onClick={() => update(it.product_id, it.quantity - 1)} className="px-2 py-1 hover:bg-neutral-100 transition-colors duration-200">−</button>
                      <span className="px-3 font-mono text-sm">{it.quantity}</span>
                      <button data-testid={`cart-inc-${it.product_id}`} onClick={() => update(it.product_id, it.quantity + 1)} className="px-2 py-1 hover:bg-neutral-100 transition-colors duration-200">+</button>
                    </div>
                    <button data-testid={`cart-remove-${it.product_id}`} onClick={() => remove(it.product_id)} className="text-neutral-500 hover:text-red-600 transition-colors duration-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-neutral-900">${it.line_total.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <div className="border border-neutral-200 p-6 sticky top-24">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-4">Summary</div>
              <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span data-testid="cart-subtotal">${cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-2"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="flex justify-between text-lg font-medium border-t border-neutral-200 pt-4 mt-4">
                <span>Total</span><span data-testid="cart-total">${cart.subtotal.toFixed(2)}</span>
              </div>
              <button
                data-testid="checkout-button"
                onClick={() => navigate("/checkout")}
                className="mt-6 w-full font-mono text-[11px] uppercase tracking-[0.2em] py-3 bg-[#002FA7] hover:bg-[#002280] text-white transition-colors duration-200"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}