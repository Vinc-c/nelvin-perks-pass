import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import CurrencySelect from "@/components/CurrencySelect";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { useCompanyAnalytics } from "@/pages/HRPortal";
import { Spinner } from "@/components/UiFeedback";
import { TrendingUp, Download, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const monthName = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

export default function MonthlyReports() {
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const a = useCompanyAnalytics(user?.company_id);
  const [activeKey, setActiveKey] = useState(null);

  const reports = useMemo(() => (a.months || []).slice().reverse().map((m) => ({
    key: m.key, label: monthName(m.key), saved: m.saved, allocated: m.allocated, redemptions: m.count, active: m.active, rate: m.rate,
  })), [a.months]);
  const active = reports.find((r) => r.key === activeKey) || reports[0];
  const chart = (a.months || []).map((m) => ({ label: m.label, value: Math.round(money.fromUsd(m.saved, currency)) }));

  if (!a.ready) return <PortalLayout title="Rapports mensuels" theme="light"><Spinner /></PortalLayout>;

  const generate = async (r) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const f = (usd) => money.format(usd, currency);
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("Nelvin Benefits — Rapport mensuel", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`${a.company?.name || ""} · ${r.label}`, 14, 30);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 34, 196, 34);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text("Synthèse", 14, 46);
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    [
      `Économies générées (remises + cashback) : ${f(r.saved)}`,
      `Allocations versées : ${f(r.allocated)}`,
      `Offres utilisées : ${r.redemptions}`,
      `Collaborateurs actifs : ${r.active} / ${a.employees.length} (${r.rate}%)`,
      `Économie moyenne par offre : ${f(r.redemptions ? r.saved / r.redemptions : 0)}`,
    ].forEach((line, i) => doc.text(line, 14, 56 + i * 8));
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Montants en ${currency} au taux Nelvin du ${new Date().toLocaleDateString("fr-FR")}. Plateforme développée par liafrik.com.`, 14, 285);
    doc.save(`Nelvin-Rapport-${r.key}.pdf`);
  };

  return (
    <PortalLayout title="Rapports mensuels" theme="light">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rapports mensuels</h1>
          <p className="text-sm text-slate-500">Synthèses PDF de l'activité réelle de vos collaborateurs.</p>
        </div>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>

      {active && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard icon={FileText} title={active.label} className="lg:col-span-1">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Économies</dt><dd className="font-semibold text-emerald-700">{money.format(active.saved, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Allocations</dt><dd className="font-semibold text-slate-900">{money.format(active.allocated, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Offres utilisées</dt><dd className="font-semibold text-slate-900">{active.redemptions}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Adoption</dt><dd className="font-semibold text-slate-900">{active.rate}%</dd></div>
            </dl>
            <button onClick={() => generate(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"><Download className="h-4 w-4" /> Télécharger le PDF</button>
          </SectionCard>
          <SectionCard icon={TrendingUp} title={`Économies sur 12 mois (${currency})`} className="lg:col-span-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(v) => money.formatIn(v, currency)} contentStyle={{ borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" name="Économies" stroke="#10B981" fill="#10B98133" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard title="Historique" className="mt-6">
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.key} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${active?.key === r.key ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <button onClick={() => setActiveKey(r.key)} className="text-left">
                <p className="font-medium capitalize text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500">{r.redemptions} offre(s) · {money.format(r.saved, currency)} économisés</p>
              </button>
              <button onClick={() => generate(r)} className="flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"><Download className="h-3.5 w-3.5" /> PDF</button>
            </div>
          ))}
        </div>
      </SectionCard>
    </PortalLayout>
  );
}
