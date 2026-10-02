import React, { useState } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher({ compact = false, variant = "dark" }) {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const current = languages.find((l) => l.code === lang);
  const light = variant === "light";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${light ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"}`}
      >
        <Globe className="h-4 w-4" />
        {!compact && <span>{current.flag} {current.label}</span>}
        {compact && <span>{current.flag}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm transition hover:bg-slate-50 ${lang === l.code ? "text-emerald-600 font-medium" : "text-slate-700"}`}
                >
                  <span>{l.flag} {l.label}</span>
                  {lang === l.code && <Check className="h-4 w-4" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}