import React, { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";
import { Image } from "@/components/ui/image";

const LIFESTYLE = [
  { src: "/images/categories/food-dining.webp", cat: "FOOD_DINING" },
  { src: "/images/categories/hotels-hospitality.webp", cat: "HOTELS_HOSPITALITY" },
  { src: "/images/categories/wellness-mental.webp", cat: "WELLNESS_MENTAL" },
  { src: "/images/categories/fitness-sports.webp", cat: "FITNESS_SPORTS" },
  { src: "/images/categories/travel-holidays.webp", cat: "TRAVEL_HOLIDAYS" },
  { src: "/images/categories/beauty-care.webp", cat: "BEAUTY_CARE" },
  { src: "/images/categories/shopping-retail.webp", cat: "SHOPPING_RETAIL" },
  { src: "/images/categories/home-living.webp", cat: "HOME_LIVING" },
];

function Card({ it, t }) {
  return (
    <div className="not-pill group relative h-36 w-52 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-nv-line transition-transform duration-500 hover:scale-[1.03] sm:h-44 sm:w-64">
      <Image src={it.src} fittingType="fill" className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
      <span className="absolute bottom-2.5 left-3 text-sm font-bold text-white drop-shadow">{t(`cat.${it.cat}`)}</span>
    </div>
  );
}

/**
 * Two rows of category photos that slide in opposite directions as the page scrolls
 * (scroll-linked motion). Falls back to the CSS marquee for reduced-motion visitors.
 */
export default function HeroLifestyleStrip() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-22%", "0%"]);
  const row2 = [...LIFESTYLE].reverse();

  if (reduce) {
    const loop = [...LIFESTYLE, ...LIFESTYLE];
    return (
      <div className="relative overflow-hidden">
        <div className="flex w-max gap-4">{loop.map((it, i) => <Card key={i} it={it} t={t} />)}</div>
      </div>
    );
  }
  return (
    <div ref={ref} className="relative space-y-4 overflow-hidden">
      <motion.div style={{ x: x1 }} className="flex w-max gap-4 will-change-transform">{[...LIFESTYLE, ...LIFESTYLE].map((it, i) => <Card key={i} it={it} t={t} />)}</motion.div>
      <motion.div style={{ x: x2 }} className="flex w-max gap-4 will-change-transform">{[...row2, ...row2].map((it, i) => <Card key={i} it={it} t={t} />)}</motion.div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}
