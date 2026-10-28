import React from "react";
import { useI18n } from "@/i18n/I18nContext";
import { usePublicContent } from "@/hooks/usePublicContent";

const initials = (name) => String(name || "?").split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
const https = (u) => (/^https:\/\//.test(u || "") ? u : "");

/**
 * Logo marquee of real partners only: logos curated in the CMS, then verified
 * merchants from the catalogue. Hidden while the network is empty.
 */
export default function PartnerLogos({ merchants = [] }) {
  const { t } = useI18n();
  const content = usePublicContent();
  const cms = (content?.logos || []).filter((l) => l.active !== false && https(l.logo_url)).map((l) => ({ name: l.name, sub: l.category || "", logo: l.logo_url }));
  const seen = new Set(cms.map((l) => l.name.toLowerCase()));
  const fromCatalog = merchants
    .filter((m) => !seen.has(String(m.name).toLowerCase()))
    .map((m) => ({ name: m.name, sub: m.city || "", logo: https(m.logo_url) }));
  const list = [...cms, ...fromCatalog].slice(0, 40);
  if (list.length === 0) return null;
  const loop = list.length >= 6 ? [...list, ...list] : list;

  return (
    <section className="bg-white/60 py-10">
      <h2 className="px-4 text-center text-2xl font-bold text-nv-ink sm:px-6 sm:text-3xl">{t("land.partners.title")}</h2>
      <p className="mt-2 px-4 text-center text-nv-muted">
        {merchants.length > 1 ? t("land.partners.count", { n: merchants.length }) : merchants.length === 1 ? t("land.partners.count1") : t("land.partners.generic")}
      </p>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
        <ul className={`flex gap-4 ${loop.length > list.length ? "w-max animate-marquee" : "flex-wrap justify-center px-4"}`}>
          {loop.map((p, i) => (
            <li key={`${p.name}-${i}`} aria-hidden={i >= list.length || undefined} className="flex min-h-20 w-64 flex-shrink-0 items-center gap-3 px-4 py-2">
              {p.logo ? (
                <img src={p.logo} alt="" loading="lazy" className="h-12 w-12 rounded-xl bg-white object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#08261D] text-sm font-bold text-[#C8A24A]">{initials(p.name)}</span>
              )}
              <span className="min-w-0 flex-1">
                <span title={p.name} className="block break-words text-sm font-semibold leading-snug text-nv-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{p.name}</span>
                {p.sub && <span className="block truncate text-xs text-slate-400">{p.sub}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
