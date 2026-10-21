import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES } from "./translations";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // The platform copy is French (see index.html lang="fr"): default to French
  // and keep English as the per-key fallback (see `t`). Storage can throw
  // (private mode, blocked site data), so every access is guarded.
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("nelvin_lang");
      return LANGUAGES.some((l) => l.code === saved) ? saved : "fr";
    } catch {
      return "fr";
    }
  });

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    try { localStorage.setItem("nelvin_lang", lang); } catch { /* storage unavailable */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = currentLang.dir;
  }, [lang, currentLang.dir]);

  const t = useCallback(
    (key, vars) => {
      const text = (translations[lang] && translations[lang][key]) || translations.en[key] || key;
      return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
    },
    [lang]
  );

  const value = { lang, setLang, t, dir: currentLang.dir, languages: LANGUAGES };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}