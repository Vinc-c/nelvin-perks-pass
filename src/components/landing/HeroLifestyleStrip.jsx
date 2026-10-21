import React from "react";
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

export default function HeroLifestyleStrip() {
  const { t } = useI18n();
  const loop = [...LIFESTYLE, ...LIFESTYLE];
  return (
    <div className="relative overflow-hidden">
      <div className="flex w-max gap-4 animate-marquee">
        {loop.map((it, i) => (
          <div key={i} className="not-pill relative h-36 w-52 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-nv-line sm:h-44 sm:w-64">
            <Image src={it.src} fittingType="fill" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
            <span className="absolute bottom-2.5 left-3 text-sm font-bold text-white drop-shadow">{t(`cat.${it.cat}`)}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}