import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import ProductCard from "@/components/app/ProductCard";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [reco, setReco] = useState([]);

  useEffect(() => {
    api.get("/products?limit=8").then((r) => setProducts(r.data));
    api.post("/ai/recommend", {}).then((r) => setReco(r.data.results || [])).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-24 lg:py-40 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-8">
              Vol. 01 — Editorial Commerce, Powered by AI
            </div>
            <h1 className="font-serif text-6xl md:text-8xl leading-[0.9] tracking-tighter font-light">
              Objects with<br />
              <span className="italic">intention.</span>
            </h1>
            <p className="mt-10 max-w-lg text-neutral-300 text-lg leading-relaxed">
              A stark boutique of considered goods, with an AI concierge that knows what you need before you ask.
            </p>
            <div className="mt-12 flex items-center gap-4">
              <Link to="/products" data-testid="hero-shop-cta" className="font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-3 bg-white text-neutral-900 hover:bg-neutral-200 transition-colors duration-200 inline-flex items-center gap-2">
                Enter the Shop <ArrowRight className="w-3 h-3" />
              </Link>
              <Link to="/search" data-testid="hero-ai-cta" className="font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-3 bg-[#002FA7] hover:bg-[#002280] text-white transition-colors duration-200 inline-flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Try AI Search
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1715541448446-3369e1cc0ee9?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85"
              alt="Editorial"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      {reco.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#002FA7] mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI Picks for You
              </div>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-neutral-900">
                Curated by the machine.
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {reco.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-[1600px] px-6 lg:px-12 py-20 border-t border-neutral-200">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-neutral-900 font-light">
            The New Arrivals
          </h2>
          <Link to="/products" data-testid="view-all-products" className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-700 hover:text-[#002FA7] transition-colors duration-200">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      </section>
    </div>
  );
}