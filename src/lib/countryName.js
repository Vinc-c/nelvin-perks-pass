import { AFRICAN_COUNTRIES } from "@/data/africanCountries";

// Countries are stored by their canonical (French) name; this only changes how
// they are displayed. Intl.DisplayNames supplies the name in the visitor's language.
const byName = new Map(AFRICAN_COUNTRIES.map((c) => [c.name, c]));
const cache = new Map();

export function countryLabel(name, locale = "en") {
  const c = byName.get(name);
  if (!c) return name;
  try {
    if (!cache.has(locale)) cache.set(locale, new Intl.DisplayNames([locale], { type: "region" }));
    return cache.get(locale).of(c.iso) || name;
  } catch {
    return name;
  }
}

/** True when the query matches the stored name, the localized name or the ISO code. */
export const countryMatches = (c, q, locale) =>
  c.name.toLowerCase().includes(q) || countryLabel(c.name, locale).toLowerCase().includes(q) || c.iso.toLowerCase().includes(q);
