import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { X, Send, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { NELVIN_ICON } from "@/components/NelvinLogo";

const SUGGESTIONS = [
  "Comment utiliser mon cashback ?",
  "Où trouver mes offres ?",
  "Comment inviter un employé ?",
  "Comment se valide un partenaire ?",
];

export default function NelvinSupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour 👋 Je suis Nelvin Support, votre assistant IA. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await invokeFunction("nelvin-support", {
        message: content,
        history: next.slice(-11),
      });
      const reply = res.data?.reply || res.data?.error || "Désolé, une erreur est survenue. Réessayez.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Nelvin AI Assistant"
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-white shadow-2xl shadow-amber-600/40 ring-2 ring-amber-300/50 transition hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Image src={NELVIN_ICON} alt="Nelvin AI" fittingType="fit" className="h-9 w-9 drop-shadow" />
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] max-h-[80vh] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3.5 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-amber-300/40">
                <Image src={NELVIN_ICON} alt="Nelvin AI" fittingType="fit" className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-tight">Nelvin AI Assistant</p>
                <p className="flex items-center gap-1.5 text-xs text-amber-300/90">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> En ligne · Premium
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-amber-500 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm text-slate-500 border border-slate-200">
                    <Loader2 className="h-4 w-4 animate-spin" /> Nelvin réfléchit…
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-4 py-3">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="not-pill rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-amber-400 hover:text-amber-700">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Écrivez votre message…"
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-50 active:scale-95">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}