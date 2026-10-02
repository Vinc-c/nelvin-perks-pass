import React from "react";
import { Image } from "@/components/ui/image";
import { categoryIcons, categoryLabels } from "@/data/mockData";

const categoryImages = {
  FOOD_DINING: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/6a31eb0f6_generated_image.png",
  TRAVEL_HOLIDAYS: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/2039384ca_generated_image.png",
  HOTELS_HOSPITALITY: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/04c5cd67b_generated_image.png",
  FITNESS_SPORTS: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/cba30820d_generated_image.png",
  WELLNESS_MENTAL: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/603a4b51a_generated_image.png",
  HEALTHCARE: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/41af3f651a_generated_image.png",
  FINANCIAL_WELLNESS: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/22417eb80_generated_image.png",
  SHOPPING_RETAIL: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/6a5e76d92_generated_image.png",
  TECHNOLOGY: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/1536141c2_generated_image.png",
  FAMILY_PARENTING: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/1070ce513_generated_image.png",
  EDUCATION_LEARNING: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/0181c0478_generated_image.png",
  HOME_LIVING: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/0bebc64e4_generated_image.png",
  AUTOMOTIVE_MOBILITY: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/667c78d01_generated_image.png",
  BEAUTY_CARE: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/542a93280_generated_image.png",
  ENTERTAINMENT: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/e88afbb65_generated_image.png",
};

const keys = Object.keys(categoryLabels);

function MiniCard({ k }) {
  return (
    <div className="w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-300/40 ring-1 ring-slate-100">
      <div className="relative h-24 w-full">
        <Image src={categoryImages[k]} fittingType="fill" className="h-full w-full" />
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow">
          {categoryIcons[k]}
        </span>
        <span className="absolute bottom-2 left-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
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
  const mid = Math.ceil(keys.length / 2);
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-sm">
      <div className="flex h-full gap-3">
        <Column items={keys.slice(0, mid)} duration={26} />
        <Column items={keys.slice(mid)} duration={32} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}