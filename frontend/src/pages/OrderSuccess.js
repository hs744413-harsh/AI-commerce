import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { useCart } from "@/context/CartContext";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);
  const { refresh } = useCart();

  const poll = useCallback(async () => {
    if (!sessionId || attempts >= 6) return;
    try {
      const r = await api.get(`/orders/checkout/status/${sessionId}`);
      if (r.data.payment_status === "paid") {
        setStatus("paid");
        refresh();
        return;
      }
      if (r.data.status === "expired") { setStatus("expired"); return; }
      setTimeout(() => setAttempts((a) => a + 1), 2000);
    } catch { setStatus("error"); }
  }, [sessionId, attempts, refresh]);

  useEffect(() => { poll(); }, [poll]);

  return (
    <div data-testid="order-success-page" className="mx-auto max-w-2xl px-6 py-32 text-center">
      {status === "paid" && (
        <>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#002FA7] mb-6">Payment Confirmed</div>
          <h1 className="font-serif text-5xl font-light mb-6">Thank you.</h1>
          <p className="text-neutral-600 mb-8">Your order has been received. You will get an email confirmation shortly.</p>
          <Link to="/orders" data-testid="view-orders-link" className="font-mono text-[11px] uppercase tracking-[0.2em] px-6 py-3 bg-neutral-900 text-white hover:bg-[#002FA7] transition-colors duration-200 inline-block">
            View orders
          </Link>
        </>
      )}
      {status === "checking" && (
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">Verifying payment…</div>
      )}
      {status === "expired" && (
        <div className="text-red-600">Session expired. Please try again.</div>
      )}
      {status === "error" && (
        <div className="text-red-600">Something went wrong.</div>
      )}
    </div>
  );
}