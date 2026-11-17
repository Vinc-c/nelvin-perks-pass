import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { categoryImage } from "@/data/offerCategories";
import { offerTitle } from "@/lib/offerTitle";
import { useI18n } from "@/i18n/I18nContext";

const INTERVAL = 5000;

/**
 * Member Home hero: auto-scrolling reel of SPONSORED offers only (is_featured).
 * A slide is a short looping video when the offer has one, otherwise its photo with a slow zoom.
 * Tapping a slide opens the partner's page.
 */
export default function SponsoredReel({ offers, meta }) {
  const { t } = useI18n();
  const items = offers.filter((o) => o.sponsored_reel && o.merchant?.slug).slice(0, 8);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const scroller = useRef(null);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const goTo = (i) => {
    const el = scroller.current;
    if (!el || !el.children[i]) return;
    el.scrollTo({ left: el.children[i].offsetLeft - el.offsetLeft, behavior: reduced ? "auto" : "smooth" });
  };

  // Auto-advance (paused on touch/hover, off for reduced motion).
  useEffect(() => {
    if (items.length < 2 || paused || reduced) return undefined;
    const id = setInterval(() => goTo((active + 1) % items.length), INTERVAL);
    return () => clearInterval(id);
  });

  // Track the slide closest to the left edge.
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const w = el.children[0]?.getBoundingClientRect().width || 1;
    const i = Math.round(el.scrollLeft / (w + 12));
    if (i !== active) setActive(Math.max(0, Math.min(items.length - 1, i)));
  };

  if (!items.length) return null;
  return (
    <section className="mb-5" aria-roledescription="carousel" aria-label={t("rd.sponsored")}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 4000)}>
      <div ref={scroller} onScroll={onScroll} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((o, i) => {
          const cat = meta(o.category);
          const poster = o.image_url || o.merchant?.cover_image_url || cat.image_url || categoryImage(o.category);
          return (
            <Link key={o.id} to={`/partenaire/${o.merchant.slug}`} aria-label={`${o.merchant_name} — ${offerTitle(o)}`}
              className="group relative block aspect-[4/5] w-[86%] shrink-0 snap-center overflow-hidden rounded-[24px] bg-slate-200 sm:aspect-[16/9] sm:w-[70%] lg:w-[48%]">
              {o.video_url && i === active && !reduced ? (
                <video src={o.video_url} poster={poster} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <Image src={poster} alt="" className={`h-full w-full ${reduced ? "" : "transition-transform [transition-duration:6000ms] ease-out"} ${i === active && !reduced ? "scale-110" : "scale-100"}`} />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
              <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-800">{t("rd.sponsored")}</span>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-sm opacity-90">{o.merchant_name}{o.city ? ` · ${o.city}` : ""}</p>
                <p className="mt-0.5 line-clamp-2 text-2xl font-medium leading-tight">{offerTitle(o)}</p>
                <span className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-medium text-slate-900">{t("rd.visitPartner")} <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.5} /></span>
              </div>
            </Link>
          );
        })}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist">
          {items.map((o, i) => (
            <button key={o.id} role="tab" aria-selected={i === active} aria-label={`${i + 1} / ${items.length}`} onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-nv-emerald" : "w-1.5 bg-slate-300"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
