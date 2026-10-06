import React from "react";
import { Image } from "@/components/ui/image";
import { OFFER_CATEGORIES } from "@/data/offerCategories";

const categoryIcons = Object.fromEntries(OFFER_CATEGORIES.map((c) => [c.value, c.emoji]));
const categoryLabels = Object.fromEntries(OFFER_CATEGORIES.map((c) => [c.value, c.label]));

const categoryImages = {
  FOOD_DINING: "/images/categories/food-dining.webp",
  TRAVEL_HOLIDAYS: "/images/categories/travel-holidays.webp",
  HOTELS_HOSPITALITY: "/images/categories/hotels-hospitality.webp",
  FITNESS_SPORTS: "/images/categories/fitness-sports.webp",
  WELLNESS_MENTAL: "/images/categories/wellness-mental.webp",
  HEALTHCARE: "/images/categories/healthcare.webp",
  FINANCIAL_WELLNESS: "/images/categories/financial-wellness.webp",
  SHOPPING_RETAIL: "/images/categories/shopping-retail.webp",
  TECHNOLOGY: "/images/categories/technology.webp",
  FAMILY_PARENTING: "/images/categories/family-parenting.webp",
  EDUCATION_LEARNING: "/images/categories/education-learning.webp",
  HOME_LIVING: "/images/categories/home-living.webp",
  AUTOMOTIVE_MOBILITY: "/images/categories/automotive-mobility.webp",
  BEAUTY_CARE: "/images/categories/beauty-care.webp",
  ENTERTAINMENT: "/images/categories/entertainment.webp",
};

const keys = Object.keys(categoryLabels);

function MiniCard({ k }) {
  return (
    <div className="w-full flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-300/40 ring-1 ring-slate-100">
      <div className="relative h-24 w-full">
        <Image src={categoryImages[k]} fittingType="fill" className="h-full w-full" />
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow">
          {categoryIcons[k]}
        </span>
        <span className="absolute bottom-2 left-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow">
          Buy 1 Get 1
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-bold text-slate-900">{categoryLabels[k]}</p>
      </div>
    </div>
  );
}

function Column({ items, duration }) {
  const loop = [...items, ...items];
  return (
    <div className="relative h-[460px] flex-1 overflow-hidden">
      <div
        className="flex flex-col gap-3"
        style={{ animation: `fall-down ${duration}s linear infinite` }}
      >
        {loop.map((k, i) => (
          <MiniCard key={`${k}-${i}`} k={k} />
        ))}
      </div>
    </div>
  );
}

export default function HeroFallingCards() {
  const third = Math.ceil(keys.length / 3);
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-md">
      <div className="flex h-full gap-3">
        <Column items={keys.slice(0, third)} duration={24} />
        <Column items={keys.slice(third, third * 2)} duration={30} />
        <Column items={keys.slice(third * 2)} duration={36} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}