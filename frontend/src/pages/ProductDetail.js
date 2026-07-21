import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data));
    api.get(`/products/${id}/reviews`).then((r) => setReviews(r.data));
  }, [id]);

  const summarize = async () => {
    setLoadingSummary(true);
    try {
      const r = await api.post("/ai/summarize-reviews", { product_id: id });
      setSummary(r.data.summary);
    } finally { setLoadingSummary(false); }
  };

  const submitReview = async () => {
    if (!user) { toast.error("Sign in to leave a review"); return; }
    if (!newReview.comment.trim()) { toast.error("Please write a comment"); return; }
    await api.post(`/products/${id}/reviews`, newReview);
    const r = await api.get(`/products/${id}/reviews`); setReviews(r.data);
    const p = await api.get(`/products/${id}`); setProduct(p.data);
    setNewReview({ rating: 5, comment: "" });
    toast.success("Review submitted");
  };

  if (!product) return <div className="p-16 font-mono text-xs text-neutral-500">Loading…</div>;

  return (
    <div data-testid="product-detail-page" className="mx-auto max-w-[1600px] px-6 lg:px-12 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <img src={product.image_url} alt={product.name} className="w-full max-h-[80vh] object-cover" />
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24 self-start">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3">{product.brand} · {product.category}</div>
          <h1 data-testid="product-name" className="font-serif text-4xl tracking-tight text-neutral-900 font-light mb-6">{product.name}</h1>
          <div className="text-2xl font-light text-neutral-900 mb-2">${product.price.toFixed(2)}</div>
          {product.review_count > 0 && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
              <Star className="w-4 h-4 fill-current" /> {product.rating} · {product.review_count} reviews
            </div>
          )}
          <p className="text-neutral-700 leading-relaxed mb-8">{product.description}</p>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-neutral-300">
              <button data-testid="qty-decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-neutral-100 transition-colors duration-200">−</button>
              <span data-testid="qty-value" className="px-4 font-mono text-sm">{qty}</span>
              <button data-testid="qty-increase" onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-neutral-100 transition-colors duration-200">+</button>
            </div>
          </div>
          <button
            data-testid="add-to-cart-button"
            onClick={() => add(product.product_id, qty)}
            className="w-full font-mono text-[11px] uppercase tracking-[0.2em] py-3 bg-neutral-900 text-white hover:bg-[#002FA7] transition-colors duration-200"
          >
            Add to Cart
          </button>
          <button
            data-testid="summarize-reviews-button"
            onClick={summarize}
            disabled={loadingSummary}
            className="mt-4 w-full font-mono text-[11px] uppercase tracking-[0.2em] py-3 border border-[#002FA7] text-[#002FA7] hover:bg-[#002FA7] hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" /> {loadingSummary ? "Analyzing…" : "AI Summarize Reviews"}
          </button>
          {summary && (
            <div data-testid="review-summary" className="mt-4 p-4 bg-neutral-50 border-l-2 border-[#002FA7] text-sm text-neutral-800 whitespace-pre-line">{summary}</div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-24 border-t border-neutral-200 pt-16">
        <h2 className="font-serif text-3xl tracking-tight text-neutral-900 mb-8">Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-6">
            {reviews.length === 0 && <div className="text-sm text-neutral-500">No reviews yet.</div>}
            {reviews.map((r) => (
              <div key={r.review_id} data-testid={`review-${r.review_id}`} className="border-b border-neutral-200 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-medium text-neutral-900">{r.user_name}</div>
                  <div className="flex text-neutral-900">{Array.from({length: r.rating}).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                </div>
                <p className="text-neutral-700 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-3">Leave a review</div>
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map((s) => (
                <button key={s} data-testid={`review-star-${s}`} onClick={() => setNewReview({...newReview, rating: s})}>
                  <Star className={`w-5 h-5 ${s <= newReview.rating ? "fill-current text-neutral-900" : "text-neutral-300"}`} />
                </button>
              ))}
            </div>
            <textarea
              data-testid="review-comment-input"
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              rows={4}
              placeholder="Tell us what you thought…"
              className="w-full border border-neutral-300 p-3 text-sm focus:border-neutral-900 focus:outline-none transition-colors duration-200"
            />
            <button
              data-testid="submit-review-button"
              onClick={submitReview}
              className="mt-3 w-full font-mono text-[11px] uppercase tracking-[0.2em] py-3 bg-neutral-900 text-white hover:bg-[#002FA7] transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}