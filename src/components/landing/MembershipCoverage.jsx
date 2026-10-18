import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import Motif from "@/components/brand/Motif";
import { OFFER_CATEGORIES } from "@/data/offerCategories";
import { CATEGORY_IMAGES as categoryImages } from "@/data/categoryImages";

const categoryLabels = Object.fromEntries(OFFER_CATEGORIES.map((c) => [c.value, c.label]));


const categoryText = {
  FOOD_DINING: "A complimentary dish or drink, from maquis to rooftop dinners.",
  TRAVEL_HOLIDAYS: "Upgrades and VIP extras on getaways across the continent.",
  HOTELS_HOSPITALITY: "Room upgrades, late checkout and welcome extras, from city hotels to resorts.",
  FITNESS_SPORTS: "Gym passes and sports sessions with premium member perks.",
  WELLNESS_MENTAL: "Spa, salon and mindfulness, at half the bill.",
  HEALTHCARE: "Health check-ups and clinics with member-only savings.",
  FINANCIAL_WELLNESS: "Free consultations and perks from trusted advisors.",
  SHOPPING_RETAIL: "Mall-wide and store discounts that stack with sales.",
  TECHNOLOGY: "Gadgets and gear at member prices.",
  FAMILY_PARENTING: "Theme parks and family days out with free extras.",
  EDUCATION_LEARNING: "Courses and learning programs at a discount.",
  HOME_LIVING: "Furniture and home essentials for less.",
  AUTOMOTIVE_MOBILITY: "Car service and mobility offers, discounted.",
  BEAUTY_CARE: "Beauty packages and self-care, half price.",
  ENTERTAINMENT: "Cinema, events and attractions with VIP access and free extras.",
};

const keys = Object.keys(categoryLabels);

function Card({ k, hidden }) {
  return (
    <Link
      to={`/merchant-directory?category=${k}`}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="group block w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-32 w-full">
        <Image src={categoryImages[k]} fittingType="fill" className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <Motif category={k} className="absolute left-3 top-3 h-9 w-9 shadow ring-2 ring-white" rounded="rounded-full" />
        <span className="absolute bottom-3 left-3 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">Premium perk</span>
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
        {loop.map((k, i) => <Card key={`${k}-${i}`} k={k} hidden={i >= items.length} />)}
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
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">15 lifestyle categories with premium perks, discounts and cashback, all year — tap any card to browse offers.</p>
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