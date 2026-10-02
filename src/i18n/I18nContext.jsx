import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES } from "./translations";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("nelvin_lang") || "en";
  });

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem("nelvin_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = currentLang.dir;
  }, [lang, currentLang.dir]);

  const t = useCallback(
    (key) => {
      return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
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