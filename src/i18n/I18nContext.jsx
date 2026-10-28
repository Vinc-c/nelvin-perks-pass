import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES } from "./translations";
import { supabase } from "@/api/supabaseClient";

const I18nContext = createContext(null);

const LOCALES = { en: "en-GB", fr: "fr-FR", sw: "sw-KE", ar: "ar-u-nu-latn", yo: "yo-NG" };

/** English is the platform's main language: everyone starts in English, and a
 *  visitor's explicit choice (language menu) is remembered on the device and,
 *  once signed in, on their profile (so emails follow the same language). */
function detectLang() {
  try {
    const saved = localStorage.getItem("nelvin_lang_choice");
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* storage unavailable */ }
  return "en";
}

const hasChoice = () => {
  try { return LANGUAGES.some((l) => l.code === localStorage.getItem("nelvin_lang_choice")); } catch { return false; }
};

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  // Explicit choice: remember it and mirror it on the signed-in profile.
  const setLang = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    try { localStorage.setItem("nelvin_lang_choice", code); } catch { /* storage unavailable */ }
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) supabase.rpc("set_my_language", { p_lang: code }).then(() => {}, () => {});
    }).catch(() => {});
  }, []);

  // On sign-in, adopt the language saved on the profile when this device has no explicit choice yet.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" || !session?.user || hasChoice()) return;
      supabase.from("profiles").select("language").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => { if (data?.language && LANGUAGES.some((l) => l.code === data.language)) setLangState(data.language); }, () => {});
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
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