import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, User, LogOut, Shield, Sparkles } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const signIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 w-full backdrop-blur-xl backdrop-saturate-150 bg-white/75 border-b border-neutral-200"
    >
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" data-testid="brand-logo" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-tight text-neutral-900">AI—Commerce</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.2em]">
          <Link to="/" data-testid="nav-home" className="text-neutral-700 hover:text-neutral-900 transition-colors duration-200">Home</Link>
          <Link to="/products" data-testid="nav-products" className="text-neutral-700 hover:text-neutral-900 transition-colors duration-200">Shop</Link>
          <Link to="/search" data-testid="nav-search" className="text-[#002FA7] hover:text-[#002280] transition-colors duration-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Search
          </Link>
          {user?.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin" className="text-neutral-700 hover:text-neutral-900 transition-colors duration-200 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <button
            data-testid="cart-button"
            onClick={() => navigate("/cart")}
            className="relative text-neutral-800 hover:text-[#002FA7] transition-colors duration-200"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.count > 0 && (
              <span data-testid="cart-count" className="absolute -top-2 -right-2 bg-[#002FA7] text-white text-[10px] font-mono w-4 h-4 flex items-center justify-center">
                {cart.count}
              </span>
            )}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <button
                data-testid="profile-button"
                onClick={() => navigate("/orders")}
                className="text-neutral-800 hover:text-[#002FA7] transition-colors duration-200"
                title={user.name}
              >
                <User className="w-5 h-5" />
              </button>
              <button
                data-testid="logout-button"
                onClick={async () => { await logout(); navigate("/"); }}
                className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              data-testid="signin-button"
              onClick={signIn}
              className="font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2 bg-neutral-900 text-white hover:bg-[#002FA7] transition-colors duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}