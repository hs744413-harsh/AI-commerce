import { useState } from "react";
import { api } from "@/services/api";
import ProductCard from "@/components/app/ProductCard";
import { Sparkles } from "lucide-react";

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const r = await api.post("/ai/semantic-search", { query });
      setResults(r.data.results || []);
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="ai-search-page" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-24">
      <div className="max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#002FA7] mb-6 flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Semantic Search
        </div>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter font-light text-neutral-900 mb-10">
          Describe what you want.
        </h1>
        <div className="flex gap-3 border-b-2 border-neutral-900 pb-2">
          <input
            data-testid="ai-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. Something to gift a friend who loves coffee"
            className="flex-1 py-3 text-xl font-serif focus:outline-none bg-transparent placeholder:text-neutral-400"
          />
          <button
            data-testid="ai-search-button"
            onClick={run}
            disabled={loading}
            className="font-mono text-[11px] uppercase tracking-[0.2em] px-6 bg-[#002FA7] hover:bg-[#002280] text-white disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? "Thinking…" : "Search"}
          </button>
        </div>
      </div>

      {searched && (
        <div className="mt-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-6">
            {loading ? "AI is reading the catalog…" : `${results.length} matches`}
          </div>
          <div data-testid="ai-search-results" className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {results.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}