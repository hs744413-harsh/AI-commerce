import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const emptyProduct = { name: "", description: "", price: 0, category: "", brand: "", image_url: "", stock: 50 };

export default function Admin() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadAll = async () => {
    const [s, p, o, u] = await Promise.all([
      api.get("/admin/stats"), api.get("/products?limit=200"),
      api.get("/admin/orders"), api.get("/admin/users"),
    ]);
    setStats(s.data); setProducts(p.data); setOrders(o.data); setUsers(u.data);
  };

  useEffect(() => { if (user?.role === "admin") loadAll(); }, [user]);

  if (loading) return <div className="p-16 font-mono text-xs">Loading…</div>;
  if (!user || user.role !== "admin") {
    return <div className="p-16 text-center text-neutral-600">Admin access only.</div>;
  }

  const saveProduct = async () => {
    if (editing.product_id) {
      await api.put(`/products/${editing.product_id}`, editing);
    } else {
      await api.post("/products", editing);
    }
    setEditing(null); toast.success("Saved"); loadAll();
  };

  const delProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    loadAll();
  };

  return (
    <div data-testid="admin-page" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-12">
      <div className="flex items-end justify-between mb-8 border-b border-neutral-900 pb-4">
        <h1 className="font-serif text-4xl font-light">Admin</h1>
        <div className="flex gap-6 font-mono text-[11px] uppercase tracking-[0.2em]">
          {["stats", "products", "orders", "users"].map((t) => (
            <button key={t} data-testid={`admin-tab-${t}`} onClick={() => setTab(t)}
              className={`transition-colors duration-200 ${tab === t ? "text-[#002FA7] border-b border-[#002FA7]" : "text-neutral-500 hover:text-neutral-900"}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === "stats" && stats && (
        <div data-testid="admin-stats" className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Products", stats.products], ["Orders", stats.orders], ["Users", stats.users],
            ["Paid", stats.paid_orders], ["Revenue", `$${stats.revenue.toFixed(2)}`],
          ].map(([label, v]) => (
            <div key={label} className="border border-neutral-300 p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
              <div className="mt-2 text-3xl font-light">{v}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div>
          <button data-testid="new-product-button" onClick={() => setEditing({...emptyProduct})}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2 bg-neutral-900 text-white hover:bg-[#002FA7] transition-colors duration-200">+ New Product</button>
          {editing && (
            <div className="border border-neutral-300 p-6 mb-6 grid grid-cols-2 gap-4">
              {["name", "brand", "category", "price", "stock", "image_url"].map((k) => (
                <input key={k} data-testid={`edit-${k}`} placeholder={k}
                  value={editing[k]}
                  onChange={(e) => setEditing({...editing, [k]: k === "price" || k === "stock" ? Number(e.target.value) : e.target.value})}
                  className="border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none transition-colors duration-200" />
              ))}
              <textarea data-testid="edit-description" placeholder="description" value={editing.description}
                onChange={(e) => setEditing({...editing, description: e.target.value})}
                className="col-span-2 border border-neutral-300 p-3 focus:border-neutral-900 focus:outline-none transition-colors duration-200" rows={3} />
              <div className="col-span-2 flex gap-2">
                <button data-testid="save-product-button" onClick={saveProduct}
                  className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2 bg-[#002FA7] text-white hover:bg-[#002280] transition-colors duration-200">Save</button>
                <button onClick={() => setEditing(null)} className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2 border border-neutral-300 hover:bg-neutral-100 transition-colors duration-200">Cancel</button>
              </div>
            </div>
          )}
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-b border-neutral-300">
              <th className="py-2">Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th></th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id} data-testid={`admin-product-${p.product_id}`} className="border-b border-neutral-200">
                  <td className="py-2 flex items-center gap-3"><img src={p.image_url} className="w-10 h-12 object-cover" alt="" />{p.name}</td>
                  <td>{p.brand}</td><td>{p.category}</td><td>${p.price.toFixed(2)}</td><td>{p.stock}</td>
                  <td className="flex gap-2 py-2">
                    <button data-testid={`edit-btn-${p.product_id}`} onClick={() => setEditing(p)} className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 border border-neutral-300 hover:bg-neutral-100 transition-colors duration-200">Edit</button>
                    <button data-testid={`del-btn-${p.product_id}`} onClick={() => delProduct(p.product_id)} className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50 transition-colors duration-200">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <table className="w-full text-sm border-collapse">
          <thead><tr className="text-left font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-b border-neutral-300">
            <th className="py-2">Order</th><th>Status</th><th>Payment</th><th>Total</th><th>Update</th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} className="border-b border-neutral-200">
                <td className="py-3">{o.order_id}</td><td>{o.status}</td><td>{o.payment_status}</td><td>${o.subtotal.toFixed(2)}</td>
                <td className="py-3">
                  <select data-testid={`order-status-${o.order_id}`} defaultValue={o.status}
                    onChange={async (e) => { await api.patch(`/admin/orders/${o.order_id}`, { status: e.target.value }); loadAll(); }}
                    className="border border-neutral-300 px-2 py-1 focus:outline-none">
                    {["pending_payment", "confirmed", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "users" && (
        <table className="w-full text-sm border-collapse">
          <thead><tr className="text-left font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-b border-neutral-300">
            <th className="py-2">Name</th><th>Email</th><th>Role</th><th>Joined</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-b border-neutral-200">
                <td className="py-3">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}