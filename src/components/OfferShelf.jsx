import React from "react";
import OfferCard from "@/components/OfferCard";

/**
 * Horizontal shelf of offers with an eyebrow + title (Trending, Recommended, New).
 * Renders nothing when there is nothing to show.
 */
export default function OfferShelf({ eyebrow, title, icon: Icon, offers, badgeFor, meta, format, onRedeem, ctaLabel }) {
  if (!offers.length) return null;
  return (
    <section className="mt-6" aria-label={title}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-nv-muted">
        {Icon && <Icon className="h-4 w-4 text-nv-gold" aria-hidden="true" />} {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-bold text-nv-ink">{title}</h2>
      <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {offers.map((o, i) => (
          <div key={o.id} className="w-[17rem] shrink-0 snap-start">
            <OfferCard offer={o} meta={meta} format={format} index={i} onRedeem={onRedeem} ctaLabel={ctaLabel} badge={badgeFor ? badgeFor(o) : null} />
          </div>
        ))}
      </div>
    </section>
  );
}
