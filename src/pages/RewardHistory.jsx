import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import StatCard from "@/components/dashboard/StatCard";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { TrendingUp, Gift, ThumbsUp, Trophy, History } from "lucide-react";

const KIND = {
  CASHBACK: { label: "Cashback", icon: TrendingUp, tone: "bg-emerald-100 text-emerald-600" },
  ALLOCATION: { label: "Allocation employeur", icon: Gift, tone: "bg-blue-100 text-blue-600" },
  REFERRAL_BONUS: { label: "Bonus parrainage", icon: Gift, tone: "bg-amber-100 text-amber-600" },
  RECOGNITION: { label: "Reconnaissance", icon: ThumbsUp, tone: "bg-rose-100 text-rose-600" },
};
const FILTERS = [["ALL", "Tout"], ["CASHBACK", "Cashback"], ["ALLOCATION", "Allocations"], ["REFERRAL_BONUS", "Parrainage"], ["RECOGNITION", "Reconnaissance"]];

export default function RewardHistory() {
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const r = useRewards(user);
  const [filter, setFilter] = useState("ALL");

  if (!r.ready) {
    return <PortalLayout title="Historique des récompenses" theme="light"><Spinner /></PortalLayout>;
  }
  const items = r.timeline.filter((t) => filter === "ALL" || t.kind === filter);
  const earned = r.badges.filter((b) => b.earned).length;

  return (
    <PortalLayout title="Historique des récompenses" theme="light">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Cashback cumulé" value={money.format(r.cashback, currency)} tone="emerald" />
        <StatCard icon={Trophy} label="Badges débloqués" value={`${earned} / ${r.badges.length}`} tone="amber" delay={0.05} />
        <StatCard icon={ThumbsUp} label="Reconnaissances reçues" value={r.metrics.received} tone="rose" delay={0.1} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === id ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={History} title="Aucune récompense pour le moment" description="Utilisez une offre partenaire pour gagner votre premier cashback." />
        ) : (
          items.map((it, i) => {
            const k = KIND[it.kind] || KIND.CASHBACK;
            const Icon = k.icon;
            return (
              <motion.div key={it.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.tone}`}><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{it.title}</p>
                  <p className="text-xs text-slate-500">{k.label} · {new Date(it.date).toLocaleDateString("fr-FR", { dateStyle: "medium" })}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-600">
                  {it.usd != null ? `+${money.format(it.usd, currency)}` : `+${it.points} pts`}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </PortalLayout>
  );
}
