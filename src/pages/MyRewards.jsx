import BadgeMedal from "@/components/brand/BadgeMedal";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { useRewards, POINTS } from "@/hooks/useRewards";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import StatCard from "@/components/dashboard/StatCard";
import { Spinner } from "@/components/UiFeedback";
import { Crown, Award, TrendingUp, Gift, Star, Info } from "lucide-react";

export default function MyRewards() {
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const r = useRewards(user);

  if (!r.ready) {
    return <PortalLayout title="Mes récompenses" theme="light"><Spinner label="Chargement de vos récompenses…" /></PortalLayout>;
  }

  const span = r.nextTier ? r.nextTier.min - r.tier.min : 1;
  const pct = r.nextTier ? Math.min(100, Math.round(((r.points - r.tier.min) / span) * 100)) : 100;
  const earned = r.badges.filter((b) => b.earned);
  const next = r.badges.filter((b) => !b.earned).sort((a, b) => b.progress - a.progress);

  return (
    <PortalLayout title="Mes récompenses" theme="light">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-amber-50"><Crown className="h-4 w-4" /> Niveau {r.tier.label}</p>
            <p className="mt-2 text-4xl font-extrabold">{r.points.toLocaleString("fr-FR")} pts</p>
            <p className="mt-1 text-sm text-amber-50">
              {earned.length} badge{earned.length > 1 ? "s" : ""} débloqué{earned.length > 1 ? "s" : ""}
              {r.nextTier ? ` · ${r.nextTier.min - r.points} pts avant le niveau ${r.nextTier.label}` : " · niveau maximum atteint"}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-amber-50"><span>{r.tier.label}</span><span>{r.nextTier?.label || "Max"}</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/25">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-white" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Total économisé" value={money.format(r.saved, currency)} tone="emerald" hint="Remises + cashback" />
        <StatCard icon={Gift} label="Offres utilisées" value={r.metrics.redemptions} tone="amber" delay={0.05} />
        <StatCard icon={Star} label="Points de reconnaissance" value={r.recognitionPoints} tone="rose" delay={0.1} hint={user?.company_id ? "Reçus de vos collègues" : "Disponible avec un compte entreprise"} />
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-semibold text-slate-900"><Award className="h-5 w-5 text-amber-500" /> Badges</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...earned, ...next].map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 8) * 0.04 }}
            className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${b.earned ? "border-amber-200 bg-white" : "border-slate-200 bg-slate-50"}`}>
            <BadgeMedal glyph={b.glyph} earned={b.earned} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{b.name}</p>
              <p className="text-xs text-slate-500">{b.desc}</p>
              {b.earned ? (
                <p className="mt-1 text-xs font-medium text-emerald-600">Débloqué</p>
              ) : (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-500" style={{ width: `${b.progress}%` }} /></div>
                  <p className="mt-1 text-xs text-slate-400">
                    {b.metric === "saved" ? `${money.format(b.value, "USD")} / ${money.format(b.target, "USD")}` : `${b.value} / ${b.target}`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p className="flex items-center gap-2 font-semibold text-slate-900"><Info className="h-4 w-4 text-slate-400" /> Comment gagner des points</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li>• {POINTS.redemption} pts par offre utilisée</li>
          <li>• {POINTS.perUsdSaved} pt par dollar économisé (remise + cashback)</li>
          <li>• {POINTS.recognitionReceived} pts par reconnaissance reçue</li>
          <li>• {POINTS.referral} pts par filleul abonné — <Link to="/referral-program" className="font-medium text-emerald-600 hover:underline">parrainer</Link></li>
        </ul>
      </div>
    </PortalLayout>
  );
}
