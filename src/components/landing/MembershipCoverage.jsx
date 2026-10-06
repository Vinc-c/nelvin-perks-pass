import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { categoryIcons, categoryLabels } from "@/data/mockData";

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

const categoryText = {
  FOOD_DINING: "Two mains for the price of one, from cafes to weekend brunch.",
  TRAVEL_HOLIDAYS: "Second traveller free on holidays and getaways across the region.",
  HOTELS_HOSPITALITY: "A second night free across stays from city hotels to resorts.",
  FITNESS_SPORTS: "Gym passes and sports sessions, Buy 1 Get 1 Free all year.",
  WELLNESS_MENTAL: "Spa, salon and mindfulness, at half the bill.",
  HEALTHCARE: "Health check-ups and clinics with member-only savings.",
  FINANCIAL_WELLNESS: "Free consultations and perks from trusted advisors.",
  SHOPPING_RETAIL: "Mall-wide and store discounts that stack with sales.",
  TECHNOLOGY: "Gadgets and gear at member prices.",
  FAMILY_PARENTING: "Theme parks and family days out, two for one.",
  EDUCATION_LEARNING: "Courses and learning programs at a discount.",
  HOME_LIVING: "Furniture and home essentials for less.",
  AUTOMOTIVE_MOBILITY: "Car service and mobility offers, discounted.",
  BEAUTY_CARE: "Beauty packages and self-care, half price.",
  ENTERTAINMENT: "Cinema, events and attractions, Buy 1 Get 1 Free.",
};

const keys = Object.keys(categoryLabels);

function Card({ k }) {
  return (
    <Link
      to={`/merchant-directory?category=${k}`}
      className="group block w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-32 w-full">
        <Image src={categoryImages[k]} fittingType="fill" className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow">{categoryIcons[k]}</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">Buy 1 Get 1</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-slate-900">{categoryLabels[k]}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{categoryText[k]}</p>
      </div>
    </Link>
  );
}

function Row({ items, reverse }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#f4f9fc] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f4f9fc] to-transparent" />
      <div className={`flex w-max gap-4 px-2 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {loop.map((k, i) => <Card key={`${k}-${i}`} k={k} />)}
      </div>
    </div>
  );
}

export default function MembershipCoverage() {
  const rowA = keys.slice(0, 8);
  const rowB = keys.slice(8);
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">What your membership covers</motion.h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">15 lifestyle categories, all Buy 1 Get 1 Free, all year — tap any card to browse offers.</p>
      </div>
      <div className="mt-8 space-y-4">
        <Row items={rowA} />
        <Row items={rowB} reverse />
      </div>
      <div className="mt-10 text-center">
        <Link to="/merchant-directory" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
          View all offers
        </Link>
      </div>
    </section>
  );
}