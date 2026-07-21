import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, testId }) {
  const { add } = useCart();
  return (
    <div data-testid={testId || `product-card-${product.product_id}`} className="group">
      <Link to={`/products/${product.product_id}`} className="block overflow-hidden bg-neutral-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full aspect-[4/5] object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{product.brand}</div>
          <Link to={`/products/${product.product_id}`} className="block text-sm text-neutral-900 hover:underline truncate">{product.name}</Link>
        </div>
        <div className="text-sm text-neutral-900 whitespace-nowrap">${product.price.toFixed(2)}</div>
      </div>
      <button
        data-testid={`quick-add-${product.product_id}`}
        onClick={() => add(product.product_id, 1)}
        className="mt-3 w-full font-mono text-[10px] uppercase tracking-[0.2em] py-2 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors duration-200"
      >
        Add to Cart
      </button>
    </div>
  );
}