import React from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const initials = (name) => String(name || "Membre").split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

function Card({ r, hidden }) {
  const { t } = useI18n();
  return (
    <figure aria-hidden={hidden || undefined} className="relative w-72 flex-shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-nv-line">
      <figcaption className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-nv-emerald to-nv-deep text-xs font-bold text-white">
          {initials(r.author)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-nv-ink">{r.author}</span>
          <span className="block truncate text-xs text-nv-muted">{r.where}</span>
        </span>
      </figcaption>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex gap-0.5" aria-label={`${r.rating} sur 5`}>
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-nv-gold text-nv-gold" : "text-slate-200"}`} />)}
        </span>
        <span className="text-xs font-semibold text-nv-emerald">{t("land.reviews.verified")}</span>
      </div>
      <blockquote className="mt-2 text-xs leading-relaxed text-nv-muted">{r.comment}</blockquote>
    </figure>
  );
}

/**
 * Member reviews: only verified reviews (left after a validated redemption).
 * Hidden until members have posted some.
 */
export default function Testimonials({ reviews = [] }) {
  const { t } = useI18n();
  if (reviews.length === 0) return null;
  const loop = reviews.length >= 4 ? [...reviews, ...reviews] : reviews;
  return (
    <section className="bg-nv-ivory-2 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-nv-ink sm:text-3xl">{t("land.reviews.title")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-nv-muted">
          {t("land.reviews.sub")}
        </p>
      </div>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        <div className={`flex gap-4 px-2 ${loop.length > reviews.length ? "w-max animate-marquee" : "flex-wrap justify-center"}`}>
          {loop.map((r, i) => <Card key={`${r.id}-${i}`} r={r} hidden={i >= reviews.length} />)}
        </div>
      </div>
    </section>
  );
}
