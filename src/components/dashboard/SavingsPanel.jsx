import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";
import NvIcon from "@/components/brand/NvIcon";
import { PiggyBank } from "lucide-react";

/** Member ROI card: what the Pass saved vs what it costs, plus the next-tier nudge. */
export default function SavingsPanel({ total, month, passCost, next, fmt }) {
  const { t } = useI18n();
  const ratio = passCost > 0 ? month / passCost : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  if (!(total > 0) && !(month > 0) && !(passCost > 0)) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-[20px] border border-slate-200 bg-white p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nv-gold/15 text-nv-bronze"><PiggyBank className="h-6 w-6" strokeWidth={1.5} /></div>
        <h2 className="mt-3 text-base font-medium text-slate-900">{t("rd.savings.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("rd.savings.desc")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{t("rd.totalSaved")} {fmt(total)}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{t("rd.thisMonth")} {fmt(month)}</span>
        </div>
        <Link to="/membership-plans" className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 text-sm font-medium text-slate-800 transition hover:bg-slate-50">{t("rd.explorePasses")} →</Link>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-nv-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-nv-deep">
        <NvIcon name="VERIFIED" className="h-5 w-5" /> {t("dash.roi.title")}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div><p className="text-xl font-bold text-nv-emerald sm:text-2xl">{fmt(total)}</p><p className="text-[11px] text-nv-muted sm:text-xs">{t("dash.roi.total")}</p></div>
        <div><p className="text-xl font-bold text-nv-gold sm:text-2xl">{fmt(month)}</p><p className="text-[11px] text-nv-muted sm:text-xs">{t("dash.roi.month")}</p></div>
        <div><p className="text-xl font-bold text-nv-ink sm:text-2xl">{passCost > 0 ? fmt(passCost) : "—"}</p><p className="text-[11px] text-nv-muted sm:text-xs">{t("dash.roi.cost")}</p></div>
      </div>
      {passCost > 0 && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-nv-ivory-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-nv-emerald to-nv-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-nv-muted">{month > 0 ? t("dash.roi.paid", { x: ratio.toFixed(1) }) : t("dash.roi.notyet")}</p>
        </div>
      )}
      {(next || passCost === 0) && (
        <Link to="/billing-settings" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-nv-deep px-4 py-2 text-xs font-semibold text-nv-gold-light transition hover:bg-nv-emerald">
          {next ? t("dash.roi.upgrade", { tier: next.name }) : t("dash.roi.nopass")} →
        </Link>
      )}
    </motion.div>
  );
}
