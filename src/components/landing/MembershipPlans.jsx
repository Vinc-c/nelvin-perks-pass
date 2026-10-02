import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    id: "africa",
    name: "Africa 2027",
    save: "Save up to $1,500",
    price: "from $49 / year",
    gradient: "from-blue-500 to-blue-700",
    features: ["1,200+ dining offers", "Fitness & sports passes", "Wellness & spa deals", "Local city hotspots"],
    featured: false,
  },
  {
    id: "mena",
    name: "MENA 2027",
    save: "Save up to $7,600",
    price: "from $162 / year",
    gradient: "from-amber-500 to-orange-600",
    features: ["5,000+ offers across MENA", "Hotels & travel stays", "Theme parks & activities", "VIP lifestyle collections"],
    featured: true,
  },
];

export default function MembershipPlans() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Choose your membership</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          One payment gives you access to all offers for the duration of your membership. All prices in USD.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-emerald-600">
          ✨ Every plan includes a 30-day free trial — no charge until your trial ends.
        </p>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          {plans.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 ${p.featured ? "sm:scale-[1.03]" : ""}`}
            >
              <div className={`bg-gradient-to-br ${p.gradient} p-6 text-white`}>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-white/80">{p.price}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">30-day free trial</span>
                <p className="mt-4 text-3xl font-extrabold">{p.save}</p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <ul className="flex-1 space-y-3 text-sm text-slate-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Check className="h-3 w-3" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block rounded-full bg-blue-600 py-3 text-center font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
                  Start 30-day free trial
                </Link>
                <Link to="/register" className="mt-3 text-center text-sm font-semibold text-blue-600 hover:underline">Buy as Gift →</Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}