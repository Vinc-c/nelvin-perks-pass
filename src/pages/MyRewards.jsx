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
import { useI18n } from "@/i18n/I18nContext";
import { Crown, Award, TrendingUp, Gift, Star, Info } from "lucide-react";

export default function MyRewards() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const r = useRewards(user);

  if (!r.ready) {
    return <PortalLayout title={t("mb.rw.title")} theme="light"><Spinner label={t("mb.rw.loading")} /></PortalLayout>;
  }

  const span = r.nextTier ? r.nextTier.min - r.tier.min : 1;
  const pct = r.nextTier ? Math.min(100, Math.round(((r.points - r.tier.min) / span) * 100)) : 100;
  const earned = r.badges.filter((b) => b.earned);
  const next = r.badges.filter((b) => !b.earned).sort((a, b) => b.progress - a.progress);

  return (
    <PortalLayout title={t("mb.rw.title")} theme="light">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-amber-50"><Crown className="h-4 w-4" /> {t("mb.rw.level", { tier: r.tier.label })}</p>
            <p className="mt-2 text-4xl font-extrabold">{t("mb.rw.pts", { n: r.points.toLocaleString(locale) })}</p>
            <p className="mt-1 text-sm text-amber-50">
              {t(earned.length === 1 ? "mb.rw.badges.one" : "mb.rw.badges.other", { n: earned.length })}
              {r.nextTier ? t("mb.rw.toNext", { n: r.nextTier.min - r.points, tier: r.nextTier.label }) : t("mb.rw.maxLevel")}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-amber-50"><span>{r.tier.label}</span><span>{r.nextTier?.label || t("mb.rw.max")}</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/25">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-white" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label={t("mb.rw.totalSaved")} value={money.format(r.saved, currency)} tone="emerald" hint={t("mb.rw.discCash")} />
        <StatCard icon={Gift} label={t("mb.rw.offersUsed")} value={r.metrics.redemptions} tone="amber" delay={0.05} />
        <StatCard icon={Star} label={t("mb.rw.recoPts")} value={r.recognitionPoints} tone="rose" delay={0.1} hint={user?.company_id ? t("mb.rw.fromColleagues") : t("mb.rw.needCompany")} />
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-semibold text-slate-900"><Award className="h-5 w-5 text-amber-500" /> {t("mb.rw.badgesTitle")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...earned, ...next].map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 8) * 0.04 }}
            className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${b.earned ? "border-amber-200 bg-white" : "border-slate-200 bg-slate-50"}`}>
            <BadgeMedal glyph={b.glyph} earned={b.earned} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{b.name}</p>
              <p className="text-xs text-slate-500">{b.desc}</p>
              {b.earned ? (
                <p className="mt-1 text-xs font-medium text-emerald-600">{t("mb.rw.unlocked")}</p>
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
        <p className="flex items-center gap-2 font-semibold text-slate-900"><Info className="h-4 w-4 text-slate-400" /> {t("mb.rw.howTitle")}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li>{t("mb.rw.how1", { n: POINTS.redemption })}</li>
          <li>{t("mb.rw.how2", { n: POINTS.perUsdSaved })}</li>
          <li>{t("mb.rw.how3", { n: POINTS.recognitionReceived })}</li>
          <li>{t("mb.rw.how4", { n: POINTS.referral })}<Link to="/referral-program" className="font-medium text-emerald-600 hover:underline">{t("mb.rw.referLink")}</Link></li>
        </ul>
      </div>
    </PortalLayout>
  );
}
