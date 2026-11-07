import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Globe, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Language picker: globe + short code (EN), accessible listbox, closes on outside click / Escape. */
export default function LanguageSwitcher({ compact = false, variant = "dark" }) {
  const { lang, setLang, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find((l) => l.code === lang) || languages[0];
  const light = variant === "light";

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("rd.lang")}: ${current.label}`}
        className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition ${light ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"}`}
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        <span>{compact ? current.code.toUpperCase() : current.label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t("rd.lang")}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {languages.map((l) => (
              <li key={l.code} role="option" aria-selected={lang === l.code}>
                <button
                  type="button"
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`flex min-h-11 w-full items-center justify-between px-3 text-sm transition hover:bg-slate-50 ${lang === l.code ? "font-medium text-emerald-700" : "text-slate-700"}`}
                >
                  <span>{l.label}</span>
                  {lang === l.code ? <Check className="h-4 w-4" /> : <span className="text-xs uppercase text-slate-400">{l.code}</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
