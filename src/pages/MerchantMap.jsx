import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import DealsMap, { distanceKm } from "@/components/DealsMap";
import { useCatalog, offerBadge } from "@/hooks/useCatalog";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { MapPin, ShieldCheck, Navigation } from "lucide-react";

export default function MerchantMap() {
  const { merchants, offers, loading } = useCatalog();
  const { meta } = useCategories();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [me, setMe] = useState(null);

  const located = merchants.filter((m) => m.lat != null && m.lng != null);
  const sorted = useMemo(() => {
    const list = located.map((m) => ({ ...m, km: me ? distanceKm(me, [Number(m.lat), Number(m.lng)]) : null }));
    return me ? list.sort((a, b) => a.km - b.km) : list;
  }, [located, me]);

  return (
    <PortalLayout title="Près de moi" theme="light">
      <DealsMap merchants={located} onLocate={setMe} height="h-[420px]" onSelect={() => {}} />
      <h2 className="mt-6 flex items-center gap-2 font-semibold text-slate-900"><Navigation className="h-5 w-5 text-emerald-600" /> {me ? "Partenaires les plus proches" : "Partenaires géolocalisés"}</h2>
      {loading ? (
        <div className="mt-3"><ListSkeleton rows={4} /></div>
      ) : sorted.length === 0 ? (
        <div className="mt-3"><EmptyState icon={MapPin} title="Aucun partenaire géolocalisé" description="Les partenaires apparaissent ici dès que leur adresse est validée par Nelvin." /></div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {sorted.map((m, i) => {
            const offer = offers.find((o) => o.merchant_id === m.id);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium text-slate-900">{meta(m.category).emoji} <span className="truncate">{m.name}</span> <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /></p>
                  <p className="text-xs text-slate-500">{[m.address, m.city].filter(Boolean).join(", ")}{m.km != null ? ` · ${m.km.toFixed(1)} km` : ""}</p>
                  {offer && <p className="mt-1 text-xs font-medium text-emerald-700">{offer.title} · {offerBadge(offer, (v) => money.format(v, currency))}</p>}
                </div>
                {offer && <Link to={`/offer-details?id=${offer.id}`} className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-600">Voir</Link>}
              </motion.div>
            );
          })}
        </div>
      )}
    </PortalLayout>
  );
}
