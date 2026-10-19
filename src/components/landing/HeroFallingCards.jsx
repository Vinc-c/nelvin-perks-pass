import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { OFFER_CATEGORIES, CATEGORY_LABELS_EN } from "@/data/offerCategories";
import { CATEGORY_IMAGES } from "@/data/categoryImages";

const keys = OFFER_CATEGORIES.map((c) => c.value);
const labels = Object.fromEntries(OFFER_CATEGORIES.map((c) => [c.value, CATEGORY_LABELS_EN[c.value] || c.label]));

function MiniCard({ k, count, hidden }) {
  return (
    <Link
      to={`/merchant-directory?category=${k}`}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="block w-full flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-300/40 ring-1 ring-nv-line transition hover:ring-[#C8A24A]"
    >
      <div className="relative h-24 w-full">
        <Image src={CATEGORY_IMAGES[k]} fittingType="fill" className="h-full w-full" />
        <span className="absolute bottom-2 left-2 rounded-full bg-nv-gold px-2 py-0.5 text-[10px] font-bold text-nv-ink shadow">
          Member offer
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3">
        <p className="min-w-0 break-words text-[11px] font-bold leading-tight text-nv-ink sm:text-xs">{labels[k]}</p>
        {count > 0 && <span className="hidden shrink-0 text-[10px] font-semibold text-nv-muted sm:inline">{count} offre{count > 1 ? "s" : ""}</span>}
      </div>
    </Link>
  );
}

function Column({ items, duration, counts }) {
  return (
    <div className="relative h-[460px] flex-1 overflow-hidden">
      <div data-fall className="flex flex-col gap-3" style={{ animation: `fall-down ${duration}s linear infinite` }}>
        {[...items, ...items].map((k, i) => (
          <MiniCard key={`${k}-${i}`} k={k} count={counts[k] || 0} hidden={i >= items.length} />
        ))}
      </div>
    </div>
  );
}

/** Hero column of category cards drifting downwards; each opens its offers. */
export default function HeroFallingCards({ counts = {} }) {
  const third = Math.ceil(keys.length / 3);
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-md">
      <div className="flex h-full gap-3">
        <Column items={keys.slice(0, third)} duration={24} counts={counts} />
        <Column items={keys.slice(third, third * 2)} duration={30} counts={counts} />
        <Column items={keys.slice(third * 2)} duration={36} counts={counts} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}
