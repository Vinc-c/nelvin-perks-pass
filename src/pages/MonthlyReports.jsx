import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import CurrencySelect from "@/components/CurrencySelect";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { useCompanyAnalytics } from "@/pages/HRPortal";
import { Spinner } from "@/components/UiFeedback";
import { useI18n } from "@/i18n/I18nContext";
import { pdfI18n } from "@/lib/receipts";
import { TrendingUp, Download, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const monthName = (key, locale) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
};

export default function MonthlyReports() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const a = useCompanyAnalytics(user?.company_id);
  const [activeKey, setActiveKey] = useState(null);

  const reports = useMemo(() => (a.months || []).slice().reverse().map((m) => ({
    key: m.key, label: monthName(m.key, locale), saved: m.saved, allocated: m.allocated, redemptions: m.count, active: m.active, rate: m.rate,
  })), [a.months, locale]);
  const active = reports.find((r) => r.key === activeKey) || reports[0];
  const chart = (a.months || []).map((m) => ({ label: m.label, value: Math.round(money.fromUsd(m.saved, currency)) }));

  if (!a.ready) return <PortalLayout title={t("hr.m.title")} theme="light"><Spinner /></PortalLayout>;

  const generate = async (r) => {
    const { jsPDF } = await import("jspdf");
    const { tr, locale: pl } = pdfI18n();
    const doc = new jsPDF();
    const f = (usd) => money.format(usd, currency);
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(tr("pdf.report"), 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`${a.company?.name || ""} · ${r.label}`, 14, 30);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 34, 196, 34);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text(tr("pdf.summary"), 14, 46);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    [
      tr("pdf.saved", { v: f(r.saved) }),
      tr("pdf.alloc", { v: f(r.allocated) }),
      tr("pdf.offers", { v: r.redemptions }),
      tr("pdf.active", { a: r.active, n: a.employees.length, r: r.rate }),
      tr("pdf.avg", { v: f(r.redemptions ? r.saved / r.redemptions : 0) }),
    ].forEach((line, i) => doc.text(line, 14, 56 + i * 8));
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(tr("pdf.footer", { currency, date: new Date().toLocaleDateString(pl) }), 14, 285);
    doc.save(tr("pdf.file", { key: r.key }));
  };

  return (
    <PortalLayout title={t("hr.m.title")} theme="light">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("hr.m.title")}</h1>
          <p className="text-sm text-slate-500">{t("hr.m.sub")}</p>
        </div>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>

      {active && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard icon={FileText} title={active.label} className="lg:col-span-1">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t("hr.m.savings")}</dt><dd className="font-semibold text-emerald-700">{money.format(active.saved, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("hr.m.alloc")}</dt><dd className="font-semibold text-slate-900">{money.format(active.allocated, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("hr.m.offers")}</dt><dd className="font-semibold text-slate-900">{active.redemptions}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("hr.m.adoption")}</dt><dd className="font-semibold text-slate-900">{active.rate}%</dd></div>
            </dl>
            <button onClick={() => generate(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"><Download className="h-4 w-4" /> {t("hr.m.download")}</button>
          </SectionCard>
          <SectionCard icon={TrendingUp} title={t("hr.m.chart", { currency })} className="lg:col-span-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(v) => money.formatIn(v, currency)} contentStyle={{ borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" name={t("hr.m.savings")} stroke="#10B981" fill="#10B98133" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard title={t("hr.m.history")} className="mt-6">
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.key} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${active?.key === r.key ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <button onClick={() => setActiveKey(r.key)} className="text-left">
                <p className="font-medium capitalize text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500">{t("hr.m.line", { n: r.redemptions, amount: money.format(r.saved, currency) })}</p>
              </button>
              <button onClick={() => generate(r)} className="flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"><Download className="h-3.5 w-3.5" /> PDF</button>
            </div>
          ))}
        </div>
      </SectionCard>
    </PortalLayout>
  );
}
