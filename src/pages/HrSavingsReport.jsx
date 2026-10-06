import React, { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import CurrencySelect from "@/components/CurrencySelect";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { categoryMeta } from "@/data/offerCategories";
import { useCompanyAnalytics } from "@/pages/HRPortal";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { PiggyBank, TrendingUp, Users, Gift, Download, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#EC4899", "#64748B"];

export default function HrSavingsReport() {
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const a = useCompanyAnalytics(user?.company_id);
  const [range, setRange] = useState(6);

  const months = useMemo(() => (a.months || []).slice(-range).map((m) => ({
    ...m,
    savedDisplay: Math.round(money.fromUsd(m.saved, currency)),
    allocatedDisplay: Math.round(money.fromUsd(m.allocated, currency)),
  })), [a.months, range, currency, money]);

  const byDept = useMemo(() => {
    if (!a.employees) return [];
    const map = new Map();
    a.employees.forEach((e) => {
      const d = e.department || "Non renseigné";
      const s = a.perEmployee.get(e.id);
      const row = map.get(d) || { dept: d, people: 0, active: 0, saved: 0 };
      row.people += 1;
      if (s?.count) row.active += 1;
      row.saved += s?.saved || 0;
      map.set(d, row);
    });
    return [...map.values()].map((r) => ({ ...r, usage: Math.round((r.active / r.people) * 100) })).sort((x, y) => y.usage - x.usage);
  }, [a.employees, a.perEmployee]);

  const byCategory = useMemo(() => Object.entries(a.byCategory || {}).map(([k, v]) => ({ name: categoryMeta(k).label, value: Math.round(money.fromUsd(v, currency)) })).sort((x, y) => y.value - x.value), [a.byCategory, currency, money]);

  if (!a.ready) return <PortalLayout title="Rapport d'économies" theme="light"><Spinner /></PortalLayout>;

  const exportCsv = () => {
    const header = ["nom", "email", "departement", "offres_utilisees", "economies_usd", "allocations_usd"];
    const lines = a.employees.map((e) => {
      const s = a.perEmployee.get(e.id) || {};
      return [e.full_name || "", e.email || "", e.department || "", s.count || 0, (s.saved || 0).toFixed(2), (s.allocated || 0).toFixed(2)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
    });
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nelvin-economies-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <PortalLayout title="Rapport d'économies" theme="light">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Économies & engagement</h1>
          <p className="text-sm text-slate-500">{a.company?.name} — données réelles de vos collaborateurs.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Période" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value={3}>3 mois</option><option value={6}>6 mois</option><option value={12}>12 mois</option>
          </select>
          <CurrencySelect value={currency} onChange={setCurrency} />
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /> CSV</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PiggyBank} label="Économies totales" value={money.format(a.totalSaved, currency)} tone="emerald" />
        <StatCard icon={Gift} label="Allocations versées" value={money.format(a.totalAllocated, currency)} tone="blue" delay={0.05} />
        <StatCard icon={TrendingUp} label="Adoption ce mois" value={`${a.adoptionRate}%`} tone="amber" delay={0.1} />
        <StatCard icon={Users} label="Économie moyenne / collaborateur" value={money.format(a.employees.length ? a.totalSaved / a.employees.length : 0, currency)} tone="rose" delay={0.15} />
      </div>

      {a.redemptionCount === 0 ? (
        <div className="mt-6"><EmptyState icon={BarChart3} title="Pas encore de données" description="Les graphiques se remplissent dès que vos collaborateurs utilisent leurs premières offres." /></div>
      ) : (
      <>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title={`Économies et allocations (${currency})`}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v) => money.formatIn(v, currency)} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="savedDisplay" name="Économies" stroke="#10B981" fill="#10B98133" strokeWidth={2} />
                <Area type="monotone" dataKey="allocatedDisplay" name="Allocations" stroke="#3B82F6" fill="#3B82F622" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Adoption par mois (%)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="rate" name="Adoption" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Adoption par département">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={12} unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="dept" stroke="#94a3b8" fontSize={12} width={110} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="usage" name="Adoption" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Économies par catégorie">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money.formatIn(v, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
      </>
      )}

      <SectionCard title="Par collaborateur" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Collaborateur</th>
                <th className="pb-3 font-medium">Département</th>
                <th className="pb-3 font-medium">Offres</th>
                <th className="pb-3 font-medium">Économies</th>
                <th className="pb-3 font-medium">Allocations</th>
              </tr>
            </thead>
            <tbody>
              {a.employees.map((e) => {
                const s = a.perEmployee.get(e.id) || {};
                return (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-900">{e.full_name || e.email}</td>
                    <td className="py-3 text-slate-500">{e.department || "—"}</td>
                    <td className="py-3 text-slate-700">{s.count || 0}</td>
                    <td className="py-3 text-emerald-700">{money.format(s.saved || 0, currency)}</td>
                    <td className="py-3 text-slate-700">{money.format(s.allocated || 0, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </PortalLayout>
  );
}
