import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { mockCurrencies } from "@/data/mockData";
import { Wallet, Gift, QrCode, Award, Utensils, Heart, Dumbbell, TrendingUp, Loader2, MapPin } from "lucide-react";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";

const BADGES = [
  { label: "Champion économies", icon: "🏆", color: "amber", threshold: 5 },
  { label: "Esprit d'équipe", icon: "🤝", color: "emerald", threshold: 3 },
  { label: "Champion bien-être", icon: "💪", color: "rose", threshold: 10 },
];

export default function EmployeePortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [currency, setCurrency] = useState(user?.wallet_currency || "USD");
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [off, mer, tx, red] = await Promise.all([
          base44.entities.Offer.list("-created_date", 100),
          base44.entities.Merchant.list("-created_date", 200),
          user ? base44.entities.Transaction.filter({ created_by_id: user.id }, "-created_date", 50) : Promise.resolve([]),
          user ? base44.entities.Redemption.filter({ created_by_id: user.id }, "-created_date", 50) : Promise.resolve([]),
        ]);
        if (!alive) return;
        setOffers(off || []);
        setMerchants(mer || []);
        setTransactions(tx || []);
        setRedemptions(red || []);
      } catch {
        if (alive) { setOffers([]); setMerchants([]); setTransactions([]); setRedemptions([]); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const merchantById = useMemo(() => {
    const m = {};
    (merchants || []).forEach((x) => { m[x.id] = x; });
    return m;
  }, [merchants]);

  const cur = mockCurrencies.find((c) => c.code === currency) || mockCurrencies[0];
  const convert = (v) => Number(v || 0) * (cur?.rate || 1);

  const balance = user?.wallet_balance ?? 0;
  const cashback = (transactions || []).reduce((s, x) => s + (x.cashback_amount || 0), 0);
  const redeemedCount = (redemptions || []).filter((r) => r.status === "REDEEMED").length;
  const recognitionPoints = redeemedCount * 10;

  // Employee offers = company/B2B benefits (exclude B2C-only).
  const employeeOffers = (offers || [])
    .filter((o) => o.target_audience !== "B2C")
    .map((o) => {
      const m = merchantById[o.merchant_id] || {};
      return { ...o, merchant_name: m.name || "Merchant", city: m.city || "", category: m.category || o.category || "" };
    });

  const recentRedemptions = (redemptions || []).map((r) => {
    const offer = (offers || []).find((o) => o.id === r.offer_id) || {};
    const m = merchantById[r.merchant_id] || merchantById[offer.merchant_id] || {};
    return {
      ...r,
      offer_title: offer.title || "Offre",
      merchant_name: m.name || "—",
      date: r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : (r.created_date ? new Date(r.created_date).toLocaleDateString() : "—"),
      cashback: r.cashback_credited || 0,
    };
  });

  const allowances = [
    { key: "dining", label: "Restaurant", icon: Utensils, total: 120, used: Math.min(120, redeemedCount * 15), color: "emerald" },
    { key: "health", label: "Santé", icon: Heart, total: 200, used: Math.min(200, Math.round(cashback)), color: "rose" },
    { key: "sport", label: "Sport", icon: Dumbbell, total: 80, used: Math.min(80, redeemedCount * 8), color: "amber" },
  ];

  return (
    <PortalLayout title={t("portal.employee.title")} theme="light">
      <AccessGate>
      <RoleWelcomeHeader />

      <div className="[&>*:first-child]:mt-0">
      {show("wallet") && (<>
      {/* Wallet + stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Solde wallet" value={`${cur.symbol}${convert(balance).toFixed(2)}`} tone="emerald" />
        <StatCard icon={TrendingUp} label="Cashback cumulé" value={`${cur.symbol}${convert(cashback).toFixed(2)}`} tone="emerald" delay={0.05} />
        <StatCard icon={QrCode} label="Offres échangées" value={redeemedCount} tone="amber" delay={0.1} />
        <StatCard icon={Gift} label="Points de reconnaissance" value={recognitionPoints} tone="rose" delay={0.15} />
      </div>

      {/* Allowance wallets */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {allowances.map((a, i) => {
          const Icon = a.icon;
          const pct = Math.round((a.used / a.total) * 100);
          return (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${a.color}-50`}>
                  <Icon className={`h-5 w-5 text-${a.color}-600`} />
                </div>
                <span className="text-xs text-slate-400">{pct}% utilisé</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{a.label}</p>
              <p className="text-2xl font-bold text-slate-900">{cur.symbol}{convert(a.total - a.used).toFixed(0)} <span className="text-sm font-normal text-slate-400">/ {cur.symbol}{convert(a.total).toFixed(0)}</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full bg-${a.color}-500`} style={{ width: `${pct}%` }} />
              </div>
            </motion.div>
          );
        })}
      </div>
      </>)}

      {/* Rewards wall */}
      {show("badges") && (
      <SectionCard title="Mur de reconnaissance" className="mt-6">
        <div className="flex flex-wrap gap-3">
          {BADGES.map((b) => {
            const unlocked = redeemedCount >= b.threshold;
            return (
              <div key={b.label} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${unlocked ? `bg-${b.color}-50` : "bg-slate-50 opacity-50"}`}>
                <span className="text-lg">{b.icon}</span>
                <span className={`text-${b.color}-600 font-medium`}>{b.label}</span>
                {!unlocked && <span className="text-xs text-slate-400">· {b.threshold} échanges</span>}
              </div>
            );
          })}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
            <Gift className="h-4 w-4 text-emerald-600" /> {recognitionPoints} points de reconnaissance
          </div>
        </div>
      </SectionCard>
      )}

      {/* Offers */}
      {show("offers") && (
      <div className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><QrCode className="h-5 w-5 text-emerald-600" /> {t("offers.title")}</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : employeeOffers.length === 0 ? (
          <EmptyState icon={QrCode} title="Aucune offre employé" description="Votre entreprise n'a pas encore d'avantages assignés." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employeeOffers.map((offer, i) => (
              <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{(offer.category || "").replace(/_/g, " ")}</span>
                  <span className="text-2xl font-bold text-slate-900">{offer.discount_type === "BOGO" ? "2-for-1" : offer.discount_type === "FIXED" ? `${cur.symbol}${offer.discount_value}` : `${offer.discount_value}%`}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{offer.title}</h3>
                <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3 w-3" /> {offer.merchant_name}{offer.city ? ` · ${offer.city}` : ""}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> {offer.cashback_rate}% cashback
                </div>
                <button
                  onClick={() => setSelectedOffer(offer)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  <QrCode className="h-4 w-4" /> {t("cta.redeem")}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Redemption history */}
      {show("history") && (
      <SectionCard title="Redemptions récentes" className="mt-6">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : recentRedemptions.length === 0 ? (
          <EmptyState icon={QrCode} title="Aucune redemption" description="Échangez votre première offre pour voir votre historique ici." />
        ) : (
          <div className="space-y-2">
            {recentRedemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.offer_title}</p>
                  <p className="text-xs text-slate-500">{r.merchant_name} · {r.date}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-1 text-xs ${r.status === "REDEEMED" ? "bg-emerald-100 text-emerald-700" : r.status === "EXPIRED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                  {r.cashback > 0 && <p className="mt-1 text-xs text-emerald-600">+{cur.symbol}{convert(r.cashback).toFixed(2)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      )}
      </div>

      <AnimatePresence>
        {selectedOffer && <QrRedemption offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}
      </AnimatePresence>
      </AccessGate>
    </PortalLayout>
  );
}