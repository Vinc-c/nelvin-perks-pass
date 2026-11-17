import React from "react";
import { Link } from "react-router-dom";
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
  // Repeat short lists so each row always fills the screen, then double it for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(12 / list.length)) }, () => list).flat();
  const rowA = base;
  const rowB = [...base.slice(Math.floor(base.length / 2)), ...base.slice(0, Math.floor(base.length / 2))];
  const fade = { maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)" };

  const Card = ({ p, hidden }) => (
    <li aria-hidden={hidden || undefined} className="flex h-[76px] w-60 flex-shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 shadow-[0_1px_2px_rgba(8,38,29,0.04)] transition hover:-translate-y-0.5 hover:border-nv-gold/60 hover:shadow-md">
      {p.logo ? (
        <img src={p.logo} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#08261D] text-sm font-medium text-[#C8A24A]">{initials(p.name)}</span>
      )}
      <span className="min-w-0 flex-1">
        <span title={p.name} className="block truncate text-sm font-medium text-nv-ink">{p.name}</span>
        {p.sub && <span className="block truncate text-xs text-slate-500">{p.sub}</span>}
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t("land.partners.verified")}</span>
      </span>
    </li>
  );
  const Row = ({ items, reverse, seconds }) => (
    <div className="overflow-hidden py-1.5" style={fade}>
      <ul className={`flex w-max gap-3 motion-reduce:animate-none ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`} style={{ animationDuration: `${seconds}s` }}>
        {[...items, ...items].map((p, i) => <Card key={`${p.name}-${i}`} p={p} hidden={i >= items.length} />)}
      </ul>
    </div>
  );

  return (
    <section className="py-14 sm:py-16">
      <h2 className="px-4 text-center text-2xl font-medium tracking-tight text-nv-ink sm:px-6 sm:text-4xl">{t("land.partners.title")}</h2>
      <p className="mt-2 px-4 text-center text-nv-muted">
        {merchants.length > 1 ? t("land.partners.count", { n: merchants.length }) : merchants.length === 1 ? t("land.partners.count1") : t("land.partners.generic")}
      </p>
      <div className="mt-8 space-y-1">
        <Row items={rowA} seconds={45} />
        <Row items={rowB} reverse seconds={55} />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        {t("land.partners.cta")} <Link to="/merchant" className="font-medium text-nv-emerald underline-offset-4 hover:underline">{t("land.partners.ctaLink")}</Link>
      </p>
    </section>
  );
}
