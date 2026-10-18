import { offerPath } from "@/lib/seo";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PartnerMap, { distanceKm } from "@/components/map/PartnerMap";
import Motif from "@/components/brand/Motif";
import KenteBand from "@/components/brand/KenteBand";
import NelvinLogo from "@/components/NelvinLogo";
import FavoriteButton from "@/components/FavoriteButton";
import { useCatalog, offerBadge } from "@/hooks/useCatalog";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { useAuth } from "@/lib/AuthContext";
import { currentPosition } from "@/lib/geocode";

const RADII = [2, 5, 10, 25];
const initials = (name) => String(name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const httpsUrl = (u) => {
  if (!u) return "";
  const v = /^https?:\/\//.test(u) ? u : `https://${u}`;
  return v.startsWith("https://") ? v : "";
};

function MerchantFace({ m, size = "h-12 w-12" }) {
  return m.logo_url ? (
    <img src={m.logo_url} alt="" className={`${size} shrink-0 rounded-full border border-slate-200 bg-white object-contain p-1`} />
  ) : (
    <span aria-hidden="true" className={`relative ${size} shrink-0 overflow-hidden rounded-full`}>
      <Motif category={m.category} className="absolute inset-0 h-full w-full" rounded="rounded-full" />
      <span className="absolute inset-[5px] flex items-center justify-center rounded-full bg-[#0E1A3B] text-sm font-bold text-white">{initials(m.name)}</span>
    </span>
  );
}

/** Public partner map: real verified partners, real positions, real distances. */
export default function MerchantMap() {
  const { user } = useAuth();
  const { merchants, offers, loading } = useCatalog();
  const { meta } = useCategories();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [me, setMe] = useState(null);
  const [radius, setRadius] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);
  const selectedId = params.get("m");
  const listRef = useRef(null);
  // Bring the partner card into view whenever a partner is selected.
  useEffect(() => { if (selectedId) listRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [selectedId]);

  const offersByMerchant = useMemo(() => {
    const map = new Map();
    offers.forEach((o) => map.set(o.merchant_id, [...(map.get(o.merchant_id) || []), o]));
    return map;
  }, [offers]);

  const located = useMemo(() => merchants.filter((m) => m.lat != null && m.lng != null), [merchants]);
  const categories = useMemo(() => [...new Set(located.map((m) => m.category))], [located]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return located
      .map((m) => ({ ...m, km: me ? distanceKm(me, [Number(m.lat), Number(m.lng)]) : null }))
      .filter((m) => category === "ALL" || m.category === category)
      .filter((m) => !q || [m.name, m.city, m.country, m.address, meta(m.category).label].some((s) => (s || "").toLowerCase().includes(q)))
      .filter((m) => !radius || (m.km != null && m.km <= radius))
      .sort((a, b) => (me ? a.km - b.km : a.name.localeCompare(b.name)));
  }, [located, query, category, me, radius, meta]);

  const selected = list.find((m) => m.id === selectedId) || located.find((m) => m.id === selectedId) || null;
  const select = (m) => {
    const next = new URLSearchParams(params);
    if (m) next.set("m", m.id); else next.delete("m");
    setParams(next, { replace: true });
  };

  const locate = async () => {
    setLocating(true);
    setGeoError("");
    try {
      const p = await currentPosition();
      setMe([p.lat, p.lng]);
    } catch (err) {
      setGeoError({
        denied: "Autorisez la localisation dans votre navigateur pour voir les partenaires autour de vous.",
        unsupported: "Votre navigateur ne permet pas la géolocalisation.",
        timeout: "Pas de réponse de la localisation. Autorisez l'accès à votre position, puis réessayez.",
      }[err.code] || "Position introuvable pour le moment, réessayez.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => { document.title = "Carte des partenaires · Nelvin"; }, []);

  const selOffers = selected ? offersByMerchant.get(selected.id) || [] : [];
  const fmt = (v) => money.format(v, currency);
  const countries = [...new Set(located.map((m) => m.country).filter(Boolean))];

  return (
    <div className="nv-body flex h-[100dvh] flex-col bg-white text-[#0E1A3B]">
      <header className="z-[500] flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <Link to="/" className="nv-focus shrink-0 rounded"><NelvinLogo className="h-9" /></Link>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link to="/merchant-directory" className="nv-focus hidden rounded-full px-4 py-2 hover:bg-[#EEF1F7] sm:inline-flex">Toutes les offres</Link>
          <Link to={user ? "/app" : "/register"} className="nv-focus rounded-full bg-[#0E1A3B] px-4 py-2 text-white hover:bg-[#27306E]">{user ? "Mon espace" : "Créer mon compte"}</Link>
        </div>
      </header>
      <KenteBand height={8} />

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* List / details */}
        <aside className="flex min-h-0 flex-1 flex-col border-slate-200 lg:w-[420px] lg:flex-none lg:border-r">
          <div className="space-y-3 border-b border-slate-200 p-4">
            <h1 className="nv-display text-xl font-semibold">Partenaires près de chez vous</h1>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, ville, quartier, catégorie" aria-label="Rechercher un partenaire"
                className="nv-focus min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <button onClick={locate} disabled={locating} className="nv-focus shrink-0 rounded-xl bg-[#0E7C66] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b6553] disabled:opacity-60">
                {locating ? "Localisation…" : me ? "Actualiser" : "Autour de moi"}
              </button>
            </div>
            {geoError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{geoError}</p>}
            {me && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs" role="group" aria-label="Rayon">
                <span className="mr-1 text-slate-500">Rayon</span>
                {[null, ...RADII].map((r) => (
                  <button key={r ?? "all"} onClick={() => setRadius(r)} aria-pressed={radius === r}
                    className={`nv-focus rounded-full px-3 py-1 font-medium ${radius === r ? "bg-[#0E1A3B] text-white" : "bg-[#EEF1F7] text-slate-700 hover:bg-slate-200"}`}>
                    {r ? `${r} km` : "Tout"}
                  </button>
                ))}
              </div>
            )}
            {categories.length > 1 && (
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 text-xs" role="group" aria-label="Catégorie">
                {["ALL", ...categories].map((c) => (
                  <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                    className={`nv-focus flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 font-medium ${category === c ? "bg-[#0E1A3B] text-white" : "bg-[#EEF1F7] text-slate-700 hover:bg-slate-200"}`}>
                    {c !== "ALL" ? <Motif category={c} className="h-5 w-5" rounded="rounded-full" /> : <span className="w-2" />}
                    {c === "ALL" ? "Toutes" : meta(c).label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {selected && (
              <section className="border-b border-slate-200 bg-[#0E1A3B] text-white" aria-label={`Partenaire ${selected.name}`}>
                {selected.cover_image_url && <img src={selected.cover_image_url} alt="" className="h-36 w-full object-cover" />}
                <div className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <MerchantFace m={selected} />
                    <div className="min-w-0 flex-1">
                      <h2 className="nv-display text-lg font-semibold leading-tight">{selected.name}</h2>
                      <p className="text-sm text-white/70">{meta(selected.category).label}{selected.km != null ? ` — à ${selected.km < 1 ? `${Math.round(selected.km * 1000)} m` : `${selected.km.toFixed(1)} km`}` : ""}</p>
                      {selected.reviews_count > 0 && <p className="mt-0.5 text-sm text-[#D4A13A]">{Number(selected.rating).toFixed(1)} / 5 sur {selected.reviews_count} avis vérifiés</p>}
                    </div>
                    <button onClick={() => select(null)} className="nv-focus rounded-full px-2 text-white/60 hover:text-white" aria-label="Fermer la fiche">✕</button>
                  </div>
                  <p className="text-sm text-white/80">{[selected.address, selected.city, selected.country].filter(Boolean).join(", ")}</p>
                  <div className="flex flex-wrap gap-2 text-sm font-semibold">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="nv-focus rounded-full bg-[#D4A13A] px-4 py-2 text-[#0E1A3B] hover:bg-[#e0b350]">Itinéraire</a>
                    {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="nv-focus rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">WhatsApp</a>}
                    {httpsUrl(selected.website) && <a href={httpsUrl(selected.website)} target="_blank" rel="noopener noreferrer" className="nv-focus rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">Site web</a>}
                  </div>
                  {selOffers.length > 0 ? (
                    <ul className="space-y-2">
                      {selOffers.map((o) => (
                        <li key={o.id} className="flex items-center gap-2 rounded-xl bg-white p-3 text-[#0E1A3B]">
                          <Link to={offerPath(o)} className="nv-focus min-w-0 flex-1 rounded">
                            <p className="truncate text-sm font-semibold">{o.title}</p>
                            <p className="text-sm font-bold text-[#0E7C66]">{offerBadge(o, fmt)}{Number(o.cashback_rate) > 0 && o.discount_type !== "CASHBACK" ? ` + ${o.cashback_rate}% de cashback` : ""}</p>
                          </Link>
                          <FavoriteButton offerId={o.id} className="shrink-0 border border-slate-200" />
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-white/70">Ses offres arrivent bientôt.</p>}
                </div>
              </section>
            )}

            {loading ? (
              <ul className="divide-y divide-slate-100" aria-busy="true">
                {[0, 1, 2, 3].map((i) => <li key={i} className="flex gap-3 p-4"><span className="h-12 w-12 animate-pulse rounded-full bg-slate-100" /><span className="h-12 flex-1 animate-pulse rounded bg-slate-100" /></li>)}
              </ul>
            ) : located.length === 0 ? (
              <div className="space-y-3 p-6">
                <h2 className="nv-display text-lg font-semibold">La carte se remplit avec nos premiers partenaires</h2>
                <p className="text-sm text-slate-600">Chaque commerce apparaît ici dès que son adresse est vérifiée par l'équipe Nelvin. Restaurants, salons, salles de sport, hôtels : rejoignez le réseau et gagnez de nouveaux clients.</p>
                <Link to="/merchant" className="nv-focus inline-flex rounded-full bg-[#0E1A3B] px-5 py-2.5 text-sm font-semibold text-white">Inscrire mon commerce</Link>
              </div>
            ) : list.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">Aucun partenaire ne correspond. Élargissez le rayon ou changez de catégorie.</p>
            ) : (
              <>
                <p className="px-4 pt-3 text-xs text-slate-500">
                  {list.length} partenaire{list.length > 1 ? "s" : ""}{me ? ", du plus proche au plus loin" : ""}{countries.length > 1 && !me ? ` dans ${countries.length} pays` : ""}
                </p>
                <ul className="divide-y divide-slate-100">
                  {list.map((m) => {
                    const best = (offersByMerchant.get(m.id) || [])[0];
                    const active = m.id === selectedId;
                    return (
                      <li key={m.id}>
                        <button onClick={() => select(m)} aria-current={active ? "true" : undefined}
                          className={`nv-focus not-pill flex w-full items-center gap-3 p-4 text-left transition-colors ${active ? "bg-[#EEF1F7]" : "hover:bg-slate-50"}`}>
                          <MerchantFace m={m} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{m.name}</span>
                            <span className="block truncate text-sm text-slate-500">{meta(m.category).label}, {m.city || m.country}</span>
                            {best && <span className="block truncate text-sm font-semibold text-[#0E7C66]"><span className="mr-1.5 rounded bg-[#0E7C66]/10 px-1.5 py-0.5">{offerBadge(best, fmt)}</span>{best.title}</span>}
                          </span>
                          {m.km != null && <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">{m.km < 1 ? `${Math.round(m.km * 1000)} m` : `${m.km.toFixed(1)} km`}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="relative h-[46dvh] shrink-0 lg:h-auto lg:flex-1">
          <PartnerMap merchants={list} selectedId={selectedId} onSelect={select} me={me} fitKey={`${category}|${radius}|${list.length === located.length}`} />
        </div>
      </div>
    </div>
  );
}
