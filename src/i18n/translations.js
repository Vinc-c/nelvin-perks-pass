// Nelvin Benefits — i18n runtime dictionaries.
// English ships with the app (it is the fallback and the default). The other
// languages are separate JSON chunks, fetched when first selected. They are generated from
// src/i18n/source.js + messages/* by scripts/build-locales.mjs (run before every build).
import en from "./locales/en.json";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬", dir: "ltr" },
];

export const translations = { en };

const loaders = {
  fr: () => import("./locales/fr.json"),
  sw: () => import("./locales/sw.json"),
  ar: () => import("./locales/ar.json"),
  yo: () => import("./locales/yo.json"),
};
const pending = {};

/** Loads a language's dictionary (no-op for English or one already loaded). */
export function loadLanguage(code) {
  if (translations[code] || !loaders[code]) return Promise.resolve();
  pending[code] ||= loaders[code]()
    .then((m) => { translations[code] = m.default; })
    .catch(() => { delete pending[code]; });
  return pending[code];
}
