import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import { mockOffers, mockMerchants, categoryIcons } from "@/data/mockData";
import { MapPin, Star, Percent, Clock, ShieldCheck, ArrowLeft, Tag, Wallet } from "lucide-react";

export default function OfferDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "o1";
  const offer = useMemo(() => mockOffers.find((o) => o.id === id) || mockOffers[0], [id]);
  const merchant = useMemo(() => mockMerchants.find((m) => m.id === offer.merchant_id), [offer]);
  const [redeem, setRedeem] = useState(false);

  const terms = [
    "Valid for one redemption per visit, per user.",
    "Cannot be combined with other ongoing promotions.",
    "Offline TOTP code valid for 3 minutes only.",
    "Cashback credited to your Nelvin wallet within 24h.",
    "Merchant reserves the right to modify terms without notice.",
  ];

  return (
    <PortalLayout title="Offer Details" theme="light">
      <Link to="/merchant-directory" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="relative h-48 bg-gradient-to-br from-emerald-100 via-blue-50 to-slate-100 p-6">
            <span className="absolute right-5 top-5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
              {categoryIcons[offer.category]} {offer.category}
            </span>
            <div className="flex h-full items-end">
              <h1 className="text-2xl font-bold text-slate-900">{offer.title}</h1>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <Percent className="h-4 w-4" />
                {offer.discount_type === "BOGO" ? "2-for-1 Deal" : `${offer.discount_value}% OFF`}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                <Wallet className="h-4 w-4" /> {offer.cashback_rate}% Cashback
              </span>
              {offer.is_featured && (
                <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  <Star className="h-4 w-4 text-amber-500" /> Featured
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-4 w-4" /> Merchant location</p>
                <p className="mt-1 font-semibold text-slate-900">{merchant?.name}</p>
                <p className="text-sm text-slate-500">{offer.city}, {merchant?.country}</p>
                <p className="mt-1 text-xs text-slate-400">★ {merchant?.rating} · {merchant?.verified_status}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><Tag className="h-4 w-4" /> Audience</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {offer.target_audience === "B2C" ? "B2C Members" : offer.target_audience === "B2B_ONLY" ? "Employees only" : "Everyone"}
                </p>
                <p className="text-sm text-slate-500">Discount type: {offer.discount_type}</p>
              </div>
            </div>

            <h2 className="mt-6 font-semibold text-slate-900">Terms of service</h2>
            <ul className="mt-3 space-y-2">
              {terms.map((term, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> {term}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => setRedeem(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600"
              >
                <Tag className="h-4 w-4" /> Redeem this offer
              </button>
              <Link to="/merchant-map" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
                <MapPin className="h-4 w-4" /> Find on map
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Quick info</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd className="font-medium text-slate-900">{offer.category}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="font-medium text-emerald-600">{offer.discount_type === "BOGO" ? "BOGO" : `${offer.discount_value}%`}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Cashback</dt><dd className="font-medium text-amber-600">{offer.cashback_rate}%</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Validity</dt><dd className="flex items-center gap-1 font-medium text-slate-900"><Clock className="h-3.5 w-3.5" /> 3 min code</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-700">VIP Gold perk</p>
            <p className="mt-1 text-sm text-amber-700/80">VIP members earn +3% extra cashback on this offer.</p>
            <Link to="/membership-plans" className="mt-3 inline-block text-sm font-medium text-amber-600 hover:underline">Upgrade pass →</Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {redeem && <QrRedemption offer={offer} onClose={() => setRedeem(false)} />}
      </AnimatePresence>
    </PortalLayout>
  );
}