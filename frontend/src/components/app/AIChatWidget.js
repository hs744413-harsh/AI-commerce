import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { API } from "@/services/api";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi — I'm your shopping assistant. Tell me what you're looking for." },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + chunk };
              return copy;
            });
          } else if (line.startsWith("event: done")) {
            const sid = line.split("data: ")[1];
            if (sid && !sessionId) setSessionId(sid);
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          data-testid="ai-chat-open"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#002FA7] hover:bg-[#002280] text-white w-14 h-14 flex items-center justify-center shadow-[0_8px_32px_rgba(0,47,167,0.3)] transition-colors duration-200"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
      {open && (
        <div
          data-testid="ai-chat-panel"
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-3rem)] bg-white/90 backdrop-blur-xl backdrop-saturate-150 border border-neutral-300 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#002FA7]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-900">AI Assistant</span>
            </div>
            <button data-testid="ai-chat-close" onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-900 transition-colors duration-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}>
                  {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-neutral-200 flex gap-2">
            <input
              data-testid="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about products…"
              className="flex-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-[#002FA7]"
            />
            <button
              data-testid="ai-chat-send"
              onClick={send}
              disabled={streaming}
              className="bg-[#002FA7] hover:bg-[#002280] disabled:opacity-50 text-white px-3 transition-colors duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}