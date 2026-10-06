import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import BenefitsBuilder from "@/components/BenefitsBuilder";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { mockCurrencies } from "@/data/mockData";
import { Users, TrendingUp, DollarSign, Search, Check, Loader2 } from "lucide-react";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import InviteEmployees from "@/components/InviteEmployees";
import { EmptyState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";

export default function HRPortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const currency = user?.wallet_currency || "USD";

  const [employees, setEmployees] = useState([]);
  const [company, setCompany] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!companyId) { setLoading(false); return; }
      setLoading(true);
      try {
        const [emps, co, txs] = await Promise.all([
          entities.User.filter({ company_id: companyId }, "-created_date", 500),
          entities.Company.get(companyId).catch(() => null),
          entities.Transaction.filter({ company_id: companyId }, "-created_date", 200),
        ]);
        if (!alive) return;
        setEmployees((emps || []).filter((e) => e.role === "EMPLOYEE"));
        setCompany(co);
        setTransactions(txs || []);
      } catch {
        if (alive) { setEmployees([]); setCompany(null); setTransactions([]); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [companyId]);

  const cur = mockCurrencies.find((c) => c.code === currency) || mockCurrencies[0];
  const convert = (v) => Number(v || 0) * (cur?.rate || 1);

  const totalSaved = (transactions || []).reduce((s, x) => s + (x.cashback_amount || 0), 0);
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.onboarded).length;
  const adoptionRate = totalEmployees ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  const adoptionData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("fr", { month: "short" }), saved: 0, count: 0 });
    }
    (transactions || []).forEach((tx) => {
      const d = new Date(tx.created_date || tx.updated_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) { m.saved += tx.cashback_amount || 0; m.count += 1; }
    });
    let cum = 0;
    return months.map((m) => { cum += m.saved; return { month: m.month, rate: Math.min(100, Math.round((m.count / Math.max(1, totalEmployees)) * 100)), saved: Math.round(convert(cum)) }; });
  }, [transactions, totalEmployees, cur]);

  const filtered = employees.filter((e) =>
    (e.full_name || e.email || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PortalLayout title={t("portal.hr.title")} theme="light">
      <AccessGate>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
      <>
      <RoleWelcomeHeader />
      <div className="[&>*:first-child]:mt-0">
      {show("analytics") && (<>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total employés" value={totalEmployees} tone="blue" />
        <StatCard icon={Check} label="Taux d'adoption" value={`${adoptionRate}%`} tone="emerald" delay={0.05} />
        <StatCard icon={DollarSign} label="Total économisé" value={`${cur.symbol}${convert(totalSaved).toFixed(0)}`} tone="amber" delay={0.1} />
        <StatCard icon={TrendingUp} label="Score d'engagement" value={`${(adoptionRate / 10).toFixed(1)}/10`} tone="rose" delay={0.15} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Taux d'adoption employés">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adoptionData}>
                <defs>
                  <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="rate" stroke="#10B981" fill="url(#adoptionGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title={`Économies cumulées (${cur.symbol})`}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adoptionData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="saved" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
      </>)}

      {/* Flexible Benefits Builder */}
      {show("benefits") && (
        <div className="mt-6">
          <BenefitsBuilder />
        </div>
      )}

      {/* Employee invitations (code-based onboarding) */}
      {show("invitations") && (
        <div className="mt-6">
          <InviteEmployees />
        </div>
      )}

      {/* Employee management */}
      {show("employees") && (
      <SectionCard title="Gestion des employés" className="mt-6" action={
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
      }>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Aucun employé" description="Invitez votre équipe pour lancer votre programme d'avantages." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Rôle</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">{(e.full_name || e.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="font-medium text-slate-900">{e.full_name || "—"}</p>
                          <p className="text-xs text-slate-400">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{e.role}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${e.onboarded ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{e.onboarded ? "actif" : "en attente"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      )}

      {/* Plan banner */}
      {section === "overview" && company && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-amber-900">Plan {company.plan_tier} — {company.seats_used || totalEmployees} / {company.max_employees || "∞"} sièges utilisés</p>
            <p className="text-sm text-amber-700">{company.subscription_status === "TRIAL" ? "Vous êtes en essai gratuit de 30 jours." : "Gérez votre abonnement et vos sièges."}</p>
          </div>
        </div>
      )}
      </div>
      </>
      )}
      </AccessGate>
    </PortalLayout>
  );
}