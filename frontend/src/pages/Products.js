import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import ProductCard from "@/components/app/ProductCard";

export default function Products() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [params, setParams] = useSearchParams();
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");

  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const q = params.get("q") || "";

  useEffect(() => { api.get("/categories").then((r) => setMeta(r.data)); }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (category) query.set("category", category);
    if (brand) query.set("brand", brand);
    if (minP) query.set("min_price", minP);
    if (maxP) query.set("max_price", maxP);
    api.get(`/products?${query.toString()}`).then((r) => setItems(r.data));
  }, [q, category, brand, minP, maxP]);

  const setFilter = (k, v) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    setParams(p);
  };

  return (
    <div data-testid="products-page" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-16">
      <div className="mb-12 flex items-end justify-between">
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter font-light text-neutral-900">Shop</h1>
        <input
          data-testid="products-search"
          placeholder="Search…"
          defaultValue={q}
          onKeyDown={(e) => { if (e.key === "Enter") setFilter("q", e.target.value); }}
          className="border-b border-neutral-300 focus:border-neutral-900 py-2 text-sm w-56 focus:outline-none bg-transparent transition-colors duration-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside data-testid="filters-panel" className="lg:col-span-3">
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Category</div>
            <div className="space-y-2">
              <button data-testid="filter-cat-all" onClick={() => setFilter("category", "")} className={`block text-sm text-left transition-colors duration-200 ${!category ? "text-neutral-900 font-medium" : "text-neutral-600 hover:text-neutral-900"}`}>All</button>
              {meta.categories.map((c) => (
                <button key={c} data-testid={`filter-cat-${c}`} onClick={() => setFilter("category", c)} className={`block text-sm text-left transition-colors duration-200 ${category === c ? "text-neutral-900 font-medium" : "text-neutral-600 hover:text-neutral-900"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Brand</div>
            <div className="space-y-2">
              <button data-testid="filter-brand-all" onClick={() => setFilter("brand", "")} className={`block text-sm text-left transition-colors duration-200 ${!brand ? "text-neutral-900 font-medium" : "text-neutral-600 hover:text-neutral-900"}`}>All</button>
              {meta.brands.map((b) => (
                <button key={b} data-testid={`filter-brand-${b}`} onClick={() => setFilter("brand", b)} className={`block text-sm text-left transition-colors duration-200 ${brand === b ? "text-neutral-900 font-medium" : "text-neutral-600 hover:text-neutral-900"}`}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Price</div>
            <div className="flex gap-2">
              <input data-testid="filter-min-price" type="number" placeholder="Min" value={minP} onChange={(e) => setMinP(e.target.value)} className="w-full border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-900 focus:outline-none transition-colors duration-200" />
              <input data-testid="filter-max-price" type="number" placeholder="Max" value={maxP} onChange={(e) => setMaxP(e.target.value)} className="w-full border border-neutral-300 px-2 py-1 text-sm focus:border-neutral-900 focus:outline-none transition-colors duration-200" />
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            {items.length} results
          </div>
          <div data-testid="products-grid" className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {items.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}