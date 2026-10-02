import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Check, X, Crown, Sparkles } from "lucide-react";

const tiers = [
  {
    id: "basic", name: "Pass Basic", price: "$9", period: "/mo",
    tagline: "Start saving on everyday deals",
    color: "slate", featured: false,
    features: { offers: "200+ offers", cities: "1 city", cashback: "Standard cashback", wallet: "1 currency wallet", support: "Email support", concierge: false, vipEvents: false, luxury: false },
  },
  {
    id: "premium", name: "Pass Premium", price: "$19", period: "/mo",
    tagline: "Most popular for members",
    color: "blue", featured: true,
    features: { offers: "1,500+ offers", cities: "All cities", cashback: "Boosted cashback", wallet: "Multi-currency wallet", support: "Priority support", concierge: false, vipEvents: false, luxury: false },
  },
  {
    id: "vip", name: "Pass VIP Gold", price: "$39", period: "/mo",
    tagline: "Luxury perks & concierge",
    color: "amber", featured: false,
    features: { offers: "5,000+ offers", cities: "All cities", cashback: "Max cashback rates", wallet: "Multi-currency wallet", support: "Concierge support", concierge: true, vipEvents: true, luxury: true },
  },
];

const rows = [
  { key: "offers", label: "Offer access" },
  { key: "cities", label: "City coverage" },
  { key: "cashback", label: "Cashback rate" },
  { key: "wallet", label: "Currency wallet" },
  { key: "support", label: "Support level" },
  { key: "concierge", label: "Personal concierge", premium: true },
  { key: "vipEvents", label: "Exclusive VIP events", premium: true },
  { key: "luxury", label: "Luxury hotel perks", premium: true },
];

function Cell({ val }) {
  if (val === true) return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-4 w-4" /></span>;
  if (val === false) return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400"><X className="h-4 w-4" /></span>;
  return <span className="text-sm font-medium text-slate-700">{val}</span>;
}

export default function MembershipTiers() {
  return (
    <PortalLayout title="Membership Tiers" theme="light">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Compare membership tiers</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">All prices in USD. Upgrade or downgrade anytime — your savings stay with you.</p>
      </div>

      {/* Cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        {tiers.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${t.featured ? "border-blue-500/50 ring-2 ring-blue-500/30 lg:scale-[1.03]" : "border-slate-200"}`}>
            {t.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Most popular</span>}
            <div className="flex items-center gap-2">
              {t.id === "vip" ? <Crown className="h-5 w-5 text-amber-500" /> : t.featured ? <Sparkles className="h-5 w-5 text-blue-600" /> : null}
              <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-slate-900">{t.price}</span>
              <span className="mb-1.5 text-slate-400">{t.period}</span>
            </div>
            <Link to="/billing-settings" className={`mt-5 block rounded-full py-3 text-center text-sm font-bold transition ${t.featured ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>Choose {t.name}</Link>
          </motion.div>
        ))}
      </div>

      {/* Comparison table */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-4 text-left font-semibold text-slate-900">Feature</th>
                {tiers.map((t) => (
                  <th key={t.id} className={`p-4 text-center font-semibold ${t.featured ? "text-blue-600" : "text-slate-900"}`}>{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={r.key} className={ri % 2 ? "bg-slate-50/50" : ""}>
                  <td className="p-4 font-medium text-slate-700">
                    {r.label}
                    {r.premium && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">PREMIUM</span>}
                  </td>
                  {tiers.map((t) => (
                    <td key={t.id} className="p-4 text-center"><Cell val={t.features[r.key]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PortalLayout>
  );
}