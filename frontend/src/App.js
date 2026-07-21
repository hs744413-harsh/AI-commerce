import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/app/Header";
import AIChatWidget from "@/components/app/AIChatWidget";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import AISearch from "@/pages/AISearch";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Orders from "@/pages/Orders";
import Admin from "@/pages/Admin";
import AuthCallback from "@/pages/AuthCallback";

function AppShell() {
  const location = useLocation();
  // Synchronous OAuth callback detection (prevents race conditions)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <>
      <Header />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/search" element={<AISearch />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer className="border-t border-neutral-200 mt-24">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-12 flex flex-col md:flex-row justify-between gap-4">
          <div className="font-serif text-xl tracking-tight">AI—Commerce</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">© 2026 · Editorial x Machine</div>
        </div>
      </footer>
      <AIChatWidget />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppShell />
            <Toaster position="top-center" />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;