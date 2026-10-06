import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { offerBadge } from "@/hooks/useCatalog";
import { categoryImage } from "@/data/offerCategories";
import FavoriteButton from "@/components/FavoriteButton";
import { MapPin, TrendingUp, QrCode } from "lucide-react";

/** Offer tile used by the member and employee dashboards. */
export default function OfferCard({ offer, meta, format, onRedeem, index = 0, ctaLabel = "Utiliser" }) {
  const cat = meta(offer.category);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index, 9) * 0.04 }} className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link to={`/offer-details?id=${offer.id}`} className="relative block h-28">
        <Image src={offer.image_url || offer.merchant?.cover_image_url || cat.image_url || categoryImage(offer.category)} alt={offer.title} className="h-full w-full" />
        {offer.is_featured && <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">⭐ À la une</span>}
        <span className="absolute bottom-3 right-3 rounded-lg bg-white/85 px-2 py-1 text-xs text-slate-700">{cat.emoji} {cat.label}</span>
      </Link>
      <FavoriteButton offerId={offer.id} className="absolute right-3 top-3" />
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/offer-details?id=${offer.id}`} className="font-semibold text-slate-900 hover:underline">{offer.title}</Link>
        <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3 w-3" /> {offer.merchant_name}{offer.city ? ` · ${offer.city}` : ""}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-emerald-600">{offerBadge(offer, format)}</span>
          {Number(offer.cashback_rate) > 0 && offer.discount_type !== "CASHBACK" && (
            <span className="flex items-center gap-1 text-xs text-amber-600"><TrendingUp className="h-3 w-3" /> {offer.cashback_rate}% cashback</span>
          )}
        </div>
        {offer.usage_limit && <p className="mt-1 text-xs text-slate-400">{offer.usage_limit}× {{ DAY: "par jour", WEEK: "par semaine", MONTH: "par mois", YEAR: "par an", LIFETIME: "au total" }[offer.usage_period]}</p>}
        <div className="flex-1" />
        <button onClick={() => onRedeem(offer)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
          <QrCode className="h-4 w-4" /> {ctaLabel}
        </button>
      </div>
    </motion.div>
  );
}
