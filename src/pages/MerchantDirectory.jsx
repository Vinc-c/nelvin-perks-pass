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
import { Search, MapPin, ShieldCheck, Tag, Store, Heart, Star } from "lucide-react";

export default function MerchantDirectory() {
  const { categories, meta } = useCategories();
  const { merchants, offers, loading } = useCatalog();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(params.get("category") || "ALL");
  const [location, setLocation] = useState("");
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

  const usedCategories = ["ALL", ...categories.map((c) => c.value).filter((v) => merchants.some((m) => m.category === v))];

  return (
    <PortalLayout title="Annuaire des partenaires" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Partenaires Nelvin</h1>
        <p className="text-sm text-slate-500">Tous les partenaires vérifiés, par catégorie et par ville.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un partenaire" aria-label="Rechercher un partenaire" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          </div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ville ou pays" aria-label="Ville ou pays" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {user && (
            <button onClick={() => setFavOnly((v) => !v)} aria-pressed={favOnly} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${favOnly ? "bg-rose-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <Heart className={`h-3.5 w-3.5 ${favOnly ? "fill-white" : ""}`} /> Mes favoris ({favoriteIds.size})
            </button>
          )}
          {usedCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {c === "ALL" ? "Toutes" : `${meta(c).emoji} ${meta(c).label}`}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{filtered.length} partenaire{filtered.length > 1 ? "s" : ""}</p>

      {loading ? (
        <div className="mt-3"><ListSkeleton rows={4} /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-3"><EmptyState icon={Store} title="Aucun partenaire trouvé" description={merchants.length ? "Modifiez vos filtres." : "Les premiers partenaires arrivent très bientôt."} /></div>
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
                  <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">{meta(m.category).emoji} {meta(m.category).label}</span>
                  {m.logo_url && <img src={m.logo_url} alt="" className="absolute bottom-3 left-3 h-10 w-10 rounded-lg bg-white object-contain p-1 shadow" />}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{m.name}</h3>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Partenaire vérifié" />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {[m.city, m.country].filter(Boolean).join(", ") || "—"}</p>
                  {m.reviews_count > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(m.rating).toFixed(1)} · {m.reviews_count} avis</p>}
                  {best ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700"><Tag className="h-3.5 w-3.5" /> {best.title} · <span className="font-semibold">{offerBadge(best, (v) => money.format(v, currency))}</span></p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Offre bientôt disponible</p>
                  )}
                  <div className="flex-1" />
                  {best && (
                    <Link to={`/offer-details?id=${best.id}`} className="mt-3 block w-full rounded-xl bg-emerald-500 py-2 text-center text-sm font-medium text-white hover:bg-emerald-600">
                      Voir l'offre{list.length > 1 ? ` (+${list.length - 1})` : ""}
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
