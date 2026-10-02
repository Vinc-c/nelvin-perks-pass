import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Image } from "@/components/ui/image";
import { mockMerchants, categoryIcons, categoryLabels } from "@/data/mockData";
import { Search, Star, MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";

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

const categories = ["ALL", "FOOD_DINING", "TRAVEL_HOLIDAYS", "HOTELS_HOSPITALITY", "FITNESS_SPORTS", "WELLNESS_MENTAL", "HEALTHCARE", "FINANCIAL_WELLNESS", "SHOPPING_RETAIL", "TECHNOLOGY", "FAMILY_PARENTING", "EDUCATION_LEARNING", "HOME_LIVING", "AUTOMOTIVE_MOBILITY", "BEAUTY_CARE", "ENTERTAINMENT"];

export default function MerchantDirectory() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(params.get("category") || "ALL");
  const [minRating, setMinRating] = useState(0);
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    return mockMerchants.filter((m) => {
      const matchesQuery = m.name.toLowerCase().includes(query.toLowerCase());
      const matchesCat = category === "ALL" || m.category === category;
      const matchesRating = m.rating >= minRating;
      const matchesLoc = !location || m.city.toLowerCase().includes(location.toLowerCase()) || m.country.toLowerCase().includes(location.toLowerCase());
      return matchesQuery && matchesCat && matchesRating && matchesLoc;
    });
  }, [query, category, minRating, location]);

  return (
    <PortalLayout title="Merchant Directory" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Partner Merchant Directory</h1>
        <p className="text-sm text-slate-500">Browse all partnered merchants by category, location, and rating.</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search merchants..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          </div>
          <div className="flex flex-1 gap-2">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or country" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <span className="text-xs">★ ≥</span>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="bg-transparent text-slate-900 outline-none">
                {[0, 4, 4.5, 4.7].map((r) => <option key={r} value={r}>{r === 0 ? "Any" : r}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {c === "ALL" ? "All" : `${categoryIcons[c] || ""} ${categoryLabels[c] || c}`}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{filtered.length} merchants found</p>

      {/* Grid */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative h-36 overflow-hidden">
              <Image src={categoryImages[m.category]} fittingType="fill" className="h-full w-full transition duration-500 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur-sm">{categoryIcons[m.category]} {categoryLabels[m.category] || m.category}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{m.name}</h3>
                {m.verified_status === "VERIFIED" && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {m.city}, {m.country}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-amber-500"><Star className="h-4 w-4" /> {m.rating}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{categoryLabels[m.category] || m.category}</span>
              </div>
              <Link
                to={`/offer-details?id=o${m.id.replace("m", "")}`}
                className="mt-3 block w-full rounded-xl bg-emerald-500 py-2 text-center text-sm font-medium text-white hover:bg-emerald-600"
              >
                View offer
              </Link>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No merchants match your filters.</p>
        )}
      </div>
    </PortalLayout>
  );
}