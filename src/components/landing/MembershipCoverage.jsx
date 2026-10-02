import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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