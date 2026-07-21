import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const sessionId = params.get("session_id");

    const finish = async () => {
      if (sessionId) {
        try {
          await api.post("/auth/session", { session_id: sessionId });
        } catch { /* noop — backend may use a different mechanism */ }
        await checkAuth();
      }
      navigate("/", { replace: true });
    };

    finish();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
        Signing in…
      </div>
    </div>
  );
}