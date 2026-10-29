// Translation helper for code that runs outside React components (api helpers,
// lib/*, thrown error messages, default data). Components should use useI18n().
import { translations } from "./translations";

export function currentLang() {
  try {
    const saved = localStorage.getItem("nelvin_lang_choice");
    if (saved && translations[saved]) return saved;
  } catch { /* storage unavailable */ }
  const html = typeof document !== "undefined" ? document.documentElement.lang : "";
  return translations[html] ? html : "en";
}

export function translate(key, vars) {
  const lang = currentLang();
  const text = (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
}

/** Locale tag for Intl / toLocaleString outside components. */
export function currentLocale() {
  return { en: "en-GB", fr: "fr-FR", sw: "sw-KE", ar: "ar-u-nu-latn", yo: "yo-NG" }[currentLang()] || "en-GB";
}
