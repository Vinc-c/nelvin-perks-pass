import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES } from "./translations";

const I18nContext = createContext(null);

const LOCALES = { en: "en-GB", fr: "fr-FR", sw: "sw-KE", ar: "ar-u-nu-latn", yo: "yo-NG" };

/** English is the platform's main language. A returning visitor keeps their saved
 *  choice; a first-time visitor gets their browser language when we support it
 *  (important for francophone / Arabic-speaking Africa), otherwise English. */
function detectLang() {
  try {
    const saved = localStorage.getItem("nelvin_lang");
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* storage unavailable */ }
  try {
    const prefs = [...(navigator.languages || []), navigator.language].filter(Boolean);
    for (const p of prefs) {
      const code = String(p).slice(0, 2).toLowerCase();
      if (LANGUAGES.some((l) => l.code === code)) return code;
    }
  } catch { /* no navigator */ }
  return "en";
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

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

  const value = { lang, setLang, t, dir: currentLang.dir, locale: LOCALES[lang] || "en-GB", languages: LANGUAGES };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}