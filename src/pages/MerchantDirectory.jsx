import { offerPath } from "@/lib/seo";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Image } from "@/components/ui/image";
import { useCategories } from "@/hooks/useCategories";
import { useCatalog, offerBadge } from "@/hooks/useCatalog";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { categoryImage } from "@/data/offerCategories";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/lib/AuthContext";
import { Search, Heart } from "lucide-react";
import NvIcon, { CategoryIcon } from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

export default function MerchantDirectory() {
  const { t, lang } = useI18n();
  const { categories, meta } = useCategories();
  const { merchants, offers, loading, offline, cachedAt } = useCatalog();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(params.get("category") || "ALL");
  const [location, setLocationState] = useState(() => {
    try { return params.get("city") || localStorage.getItem("nelvin_city") || ""; } catch { return ""; }
  });
  const setLocation = (v) => {
    setLocationState(v);
    try { localStorage.setItem("nelvin_city", v); } catch { /* storage unavailable */ }
  };
  const { user } = useAuth();
  const { ids: favoriteIds } = useFavorites();
  const [favOnly, setFavOnly] = useState(params.get("favorites") === "1");

  const offersByMerchant = useMemo(() => {
    const m = new Map();
    offers.forEach((o) => m.set(o.merchant_id, [...(m.get(o.merchant_id) || []), o]));
    return m;
  }, [offers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    return merchants.filter((m) =>
      (!q || m.name.toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q)) &&
      (category === "ALL" || m.category === category) &&
      (!loc || (m.city || "").toLowerCase().includes(loc) || (m.country || "").toLowerCase().includes(loc)) &&
      (!favOnly || (offersByMerchant.get(m.id) || []).some((o) => favoriteIds.has(o.id)))
    );
  }, [merchants, query, category, location, favOnly, favoriteIds, offersByMerchant]);

  // Cities with the most partners, as one-tap chips (people think "my city" first).
  const topCities = useMemo(() => {
    const n = new Map();
    merchants.forEach((m) => { const c = (m.city || "").trim(); if (c) n.set(c, (n.get(c) || 0) + 1); });
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c);
  }, [merchants]);

  const usedCategories = ["ALL", ...categories.map((c) => c.value).filter((v) => merchants.some((m) => m.category === v))];

  return (
    <PortalLayout title={t("dir.title")} theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">{t("dir.heading")}</h1>
        <p className="text-sm text-slate-500">{t("dir.sub")}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dir.search")} aria-label={t("dir.search")} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          </div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("dir.cityOrCountry")} aria-label={t("dir.cityOrCountry")} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
        {topCities.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={t("dir.cities")}>
            <NvIcon name="CITY_PIN" className="h-5 w-5 text-nv-emerald" />
            {topCities.map((c) => (
              <button key={c} onClick={() => setLocation(location.toLowerCase() === c.toLowerCase() ? "" : c)} aria-pressed={location.toLowerCase() === c.toLowerCase()} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${location.toLowerCase() === c.toLowerCase() ? "bg-nv-deep text-white shadow" : "border border-nv-line bg-white text-slate-600 hover:bg-nv-ivory"}`}>
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {user && (
            <button onClick={() => setFavOnly((v) => !v)} aria-pressed={favOnly} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${favOnly ? "bg-rose-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <Heart className={`h-3.5 w-3.5 ${favOnly ? "fill-white" : ""}`} /> {t("dir.favorites", { n: favoriteIds.size })}
            </button>
          )}
          {usedCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-nv-deep text-white shadow" : "border border-nv-line bg-white text-slate-600 hover:bg-nv-ivory"}`}>
              {c === "ALL" ? <NvIcon name="AFRICA" tone={category === c ? "dark" : "light"} className="h-4 w-4" /> : <CategoryIcon category={c} tone={category === c ? "dark" : "light"} className="h-4 w-4" />}
              {c === "ALL" ? t("dir.all") : meta(c).label}
            </button>
          ))}
        </div>
      </div>

      {offline && (
        <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {cachedAt ? t("dir.offlineDate", { date: new Date(cachedAt).toLocaleDateString(lang) }) : t("dir.offline")}
        </p>
      )}
      {!location && topCities.length > 0 && !loading && (
        <p className="mt-3 text-xs text-slate-500">{t("dir.tip")}</p>
      )}
      <p className="mt-4 text-sm text-slate-500">{filtered.length > 1 ? t("dir.countN", { n: filtered.length }) : t("dir.count1", { n: filtered.length })}</p>

      {loading ? (
        <div className="mt-3"><ListSkeleton rows={4} /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-3"><EmptyState glyph="AFRICA" title={t("dir.emptyTitle")} description={merchants.length ? t("dir.emptyFilters") : t("dir.emptySoon")} /></div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => {
            const list = offersByMerchant.get(m.id) || [];
            const best = (favOnly && list.find((o) => favoriteIds.has(o.id))) || list[0];
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-36 overflow-hidden">
                  <Image src={m.cover_image_url || meta(m.category).image_url || categoryImage(m.category)} alt={m.name} className="h-full w-full transition duration-500 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-nv-ink backdrop-blur-sm"><CategoryIcon category={m.category} className="h-3.5 w-3.5 text-nv-emerald" /> {meta(m.category).label}</span>
                  {m.logo_url && <img src={m.logo_url} alt="" className="absolute bottom-3 left-3 h-10 w-10 rounded-lg bg-white object-contain p-1 shadow" />}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{m.name}</h3>
                    <NvIcon name="VERIFIED" className="h-5 w-5 shrink-0 text-nv-emerald" label={t("dir.verified")} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><NvIcon name="CITY_PIN" className="h-4 w-4" /> {[m.city, m.country].filter(Boolean).join(", ") || "—"}</p>
                  {m.reviews_count > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><NvIcon name="STAR_MARK" className="h-4 w-4 text-nv-bronze" /> {t("dir.reviews", { rating: Number(m.rating).toFixed(1), n: m.reviews_count })}</p>}
                  {best ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700"><NvIcon name={best.discount_type === "PERK" ? "PERK_GIFT" : "PERCENT"} className="h-4 w-4 shrink-0" /> {best.title} · <span className="font-semibold">{offerBadge(best, (v) => money.format(v, currency), t)}</span></p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">{t("dir.soon")}</p>
                  )}
                  <div className="flex-1" />
                  {best && (
                    <Link to={offerPath(best)} className="mt-3 block w-full rounded-xl bg-nv-emerald py-2 text-center text-sm font-semibold text-white hover:bg-nv-deep">
                      {list.length > 1 ? t("dir.viewOfferMore", { n: list.length - 1 }) : t("dir.viewOffer")}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
