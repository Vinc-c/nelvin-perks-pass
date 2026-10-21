import { offerPath } from "@/lib/seo";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { offerBadge } from "@/hooks/useCatalog";
import { categoryImage } from "@/data/offerCategories";
import FavoriteButton from "@/components/FavoriteButton";
import NvIcon, { CategoryIcon } from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

/** Offer tile used by the member and employee dashboards. */
export default function OfferCard({ offer, meta, format, onRedeem, index = 0, ctaLabel = "Utiliser" }) {
  const { t } = useI18n();
  const cat = meta(offer.category);
  const isPerk = offer.discount_type === "PERK";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index, 9) * 0.04 }} className="group relative flex flex-col overflow-hidden rounded-2xl border border-nv-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={offerPath(offer)} className="relative block h-32 overflow-hidden">
        <Image src={offer.image_url || offer.merchant?.cover_image_url || cat.image_url || categoryImage(offer.category)} alt={offer.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-nv-deep/60 via-transparent to-transparent" />
        {offer.required_plan && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-nv-deep px-2.5 py-1 text-xs font-bold text-nv-gold-light shadow">
            <NvIcon name={offer.required_plan === "PASS_VIP" ? "PASS_VIP" : "PASS_PREMIUM"} tone="dark" className="h-3.5 w-3.5" />
            {offer.required_plan === "PASS_VIP" ? "VIP Gold" : "Premium"}
          </span>
        )}
        {offer.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-nv-gold px-2.5 py-1 text-xs font-bold text-nv-deep shadow">
            <NvIcon name="STAR_MARK" className="h-3.5 w-3.5" /> {t("offer.featured")}
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-nv-ink backdrop-blur-sm">
          <CategoryIcon category={offer.category} className="h-3.5 w-3.5 text-nv-emerald" /> {cat.label}
        </span>
      </Link>
      <FavoriteButton offerId={offer.id} className="absolute right-3 top-3" />
      <div className="flex flex-1 flex-col p-4">
        <Link to={offerPath(offer)} className="font-semibold text-nv-ink hover:underline">{offer.title}</Link>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-nv-muted"><NvIcon name="CITY_PIN" className="h-4 w-4 shrink-0" /> <span className="truncate">{offer.merchant_name}{offer.city ? ` · ${offer.city}` : ""}</span></p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-base font-bold text-nv-emerald">
            <NvIcon name={isPerk ? "PERK_GIFT" : "PERCENT"} className="h-5 w-5" /> {offerBadge(offer, format, t)}
          </span>
          {Number(offer.cashback_rate) > 0 && offer.discount_type !== "CASHBACK" && (
            <span className="flex items-center gap-1 text-xs font-medium text-nv-bronze"><NvIcon name="CASHBACK" className="h-4 w-4" /> {offer.cashback_rate}%</span>
          )}
        </div>
        {offer.usage_limit && <p className="mt-1 text-xs text-nv-muted">{offer.usage_limit}× {t(`offer.per.${offer.usage_period}`)}</p>}
        <div className="flex-1" />
        <button onClick={() => onRedeem(offer)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-nv-emerald py-2.5 text-sm font-semibold text-white transition hover:bg-nv-deep">
          <NvIcon name="QR_CODE" tone="dark" className="h-5 w-5" /> {ctaLabel}
        </button>
      </div>
    </motion.div>
  );
}
