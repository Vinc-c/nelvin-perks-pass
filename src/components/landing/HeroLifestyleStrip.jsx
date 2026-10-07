import React from "react";
import { Image } from "@/components/ui/image";

const LIFESTYLE = [
  { src: "/images/categories/food-dining.webp", label: "Dining" },
  { src: "/images/categories/hotels-hospitality.webp", label: "Hotels" },
  { src: "/images/categories/wellness-mental.webp", label: "Wellness" },
  { src: "/images/categories/fitness-sports.webp", label: "Fitness" },
  { src: "/images/categories/travel-holidays.webp", label: "Travel" },
  { src: "/images/categories/beauty-care.webp", label: "Beauty" },
  { src: "/images/categories/shopping-retail.webp", label: "Shopping" },
  { src: "/images/categories/home-living.webp", label: "Home" },
];

export default function HeroLifestyleStrip() {
  const loop = [...LIFESTYLE, ...LIFESTYLE];
  return (
    <div className="relative overflow-hidden">
      <div className="flex w-max gap-4 animate-marquee">
        {loop.map((it, i) => (
          <div key={i} className="not-pill relative h-36 w-52 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200 sm:h-44 sm:w-64">
            <Image src={it.src} fittingType="fill" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
            <span className="absolute bottom-2.5 left-3 text-sm font-bold text-white drop-shadow">{it.label}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}