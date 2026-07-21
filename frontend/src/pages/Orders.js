import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/orders").then((r) => setOrders(r.data));
  }, [user]);

  if (!user) return <div className="p-16 text-center text-neutral-600">Please sign in to view orders.</div>;

  return (
    <div data-testid="orders-page" className="mx-auto max-w-[1200px] px-6 lg:px-12 py-16">
      <h1 className="font-serif text-5xl tracking-tighter font-light mb-12">Orders</h1>
      {orders.length === 0 && <div className="text-neutral-500">No orders yet. <Link to="/products" className="underline">Shop now</Link>.</div>}
      <div className="divide-y divide-neutral-200">
        {orders.map((o) => (
          <div key={o.order_id} data-testid={`order-${o.order_id}`} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Order</div>
              <div className="text-sm text-neutral-900">{o.order_id}</div>
              <div className="text-[11px] text-neutral-500 mt-1">{new Date(o.created_at).toLocaleDateString()}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Status</div>
              <div className="text-sm">{o.status}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Payment</div>
              <div className="text-sm">{o.payment_status}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Tracking</div>
              <div className="text-sm">{o.tracking_number || "—"}</div>
            </div>
            <div className="md:col-span-3 text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Total</div>
              <div className="text-lg">${o.subtotal.toFixed(2)}</div>
            </div>
            <div className="md:col-span-12 flex gap-3 flex-wrap">
              {o.items.map((it, i) => (
                <img key={i} src={it.image_url} alt="" className="w-16 h-20 object-cover" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}