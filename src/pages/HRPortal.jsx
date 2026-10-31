import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import BenefitsBuilder from "@/components/BenefitsBuilder";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { usePlans } from "@/hooks/usePlans";
import { useToast } from "@/components/ui/use-toast";
import { Users, PiggyBank, Search, Check, Loader2, UserMinus, Activity } from "lucide-react";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import InviteEmployees from "@/components/InviteEmployees";
import CurrencySelect from "@/components/CurrencySelect";
import { EmptyState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";

/** Company analytics shared by the HR portal and the HR reports. */
export function useCompanyAnalytics(companyId) {
  const { locale } = useI18n();
  const { data, loading, reload } = useAsync(async () => {
    if (!companyId) return null;
    const [employees, company, txs] = await Promise.all([
      entities.User.filter({ company_id: companyId }, "full_name", 1000),
      entities.Company.get(companyId).catch(() => null),
      entities.Transaction.filter({ company_id: companyId, type: ["REDEMPTION", "ALLOCATION"], status: "COMPLETED" }, "-created_date", 5000),
    ]);
    return { employees: Array.isArray(employees) ? employees : [], company, txs: Array.isArray(txs) ? txs : [] };
  }, [companyId]);

  const computed = useMemo(() => {
    if (!data) return null;
    const staff = data.employees.filter((e) => e.role === "EMPLOYEE" || e.role === "HR_ADMIN");
    const redemptions = data.txs.filter((t) => t.type === "REDEMPTION");
    const allocations = data.txs.filter((t) => t.type === "ALLOCATION");
    const savedOf = (t) => Number(t.savings_usd || 0) + Number(t.cashback_amount || 0);
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString(locale, { month: "short" }), saved: 0, users: new Set(), count: 0, allocated: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    redemptions.forEach((t) => {
      const m = byKey.get(t.created_date.slice(0, 7));
      if (m) { m.saved += savedOf(t); m.users.add(t.user_id); m.count += 1; }
    });
    allocations.forEach((t) => {
      const m = byKey.get(t.created_date.slice(0, 7));
      if (m) m.allocated += Number(t.amount_usd || 0);
    });
    const perEmployee = new Map();
    redemptions.forEach((t) => {
      const p = perEmployee.get(t.user_id) || { saved: 0, count: 0, allocated: 0 };
      p.saved += savedOf(t); p.count += 1;
      perEmployee.set(t.user_id, p);
    });
    allocations.forEach((t) => {
      const p = perEmployee.get(t.user_id) || { saved: 0, count: 0, allocated: 0 };
      p.allocated += Number(t.amount_usd || 0);
      perEmployee.set(t.user_id, p);
    });
    const thisMonth = months[months.length - 1];
    return {
      company: data.company,
      employees: staff,
      months: months.map((m) => ({ ...m, active: m.users.size, rate: staff.length ? Math.round((m.users.size / staff.length) * 100) : 0 })),
      totalSaved: redemptions.reduce((s, t) => s + savedOf(t), 0),
      totalAllocated: allocations.reduce((s, t) => s + Number(t.amount_usd || 0), 0),
      redemptionCount: redemptions.length,
      activeThisMonth: thisMonth.users.size,
      adoptionRate: staff.length ? Math.round((thisMonth.users.size / staff.length) * 100) : 0,
      perEmployee,
      byCategory: redemptions.reduce((acc, t) => { acc[t.category || "AUTRE"] = (acc[t.category || "AUTRE"] || 0) + savedOf(t); return acc; }, {}),
    };
  }, [data, locale]);

  return { ...(computed || {}), loading, reload, ready: !!computed };
}

export default function HRPortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const { byCode } = usePlans();
  const a = useCompanyAnalytics(user?.company_id);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;
  const fmt = (usd) => money.format(usd, currency);

  const filtered = (a.employees || []).filter((e) => [e.full_name, e.email, e.department].some((v) => (v || "").toLowerCase().includes(query.toLowerCase())));

  const remove = async (e) => {
    if (!window.confirm(t("hr.p.confirmRemove", { name: e.full_name || e.email }))) return;
    setBusyId(e.id);
    try {
      await callRpc("hr_remove_employee", { p_user_id: e.id });
      toast({ title: t("hr.p.removed") });
      a.reload();
    } catch (err) {
      toast({ title: t("hr.p.error"), description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const setDepartment = async (e, value) => {
    if ((value || "") === (e.department || "")) return;
    try {
      await callRpc("hr_set_department", { p_user_id: e.id, p_department: value });
      a.reload();
    } catch (err) {
      toast({ title: t("hr.p.error"), description: err.message, variant: "destructive" });
    }
  };

  const chart = (a.months || []).slice(-6);
  const plan = a.company ? byCode(a.company.plan_tier) : null;

  return (
    <PortalLayout title={t("portal.hr.title")} theme="light">
      <AccessGate>
      {a.loading && !a.ready ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : !a.ready ? (
        <div className="mx-auto my-16 max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="font-semibold text-slate-900">{user?.company_id ? "We couldn't load your company data" : "No company is linked to this account yet"}</p>
          <p className="mt-1 text-sm text-slate-500">{user?.company_id ? "Check your connection and try again." : "Ask your administrator for an invitation."}</p>
          {user?.company_id && <button type="button" onClick={a.reload} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Retry</button>}
        </div>
      ) : (
      <>
      <RoleWelcomeHeader />
      <div className="mb-4 flex justify-end"><CurrencySelect value={currency} onChange={setCurrency} /></div>
      <div className="[&>*:first-child]:mt-0">
      {show("analytics") && (<>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t("hr.p.staff")} value={a.employees.length} tone="blue" hint={a.company ? t("hr.p.seatsHint", { used: a.company.seats_used, max: a.company.max_employees >= 100000 ? "∞" : a.company.max_employees }) : undefined} />
        <StatCard icon={Check} label={t("hr.p.adoption")} value={`${a.adoptionRate}%`} tone="emerald" delay={0.05} hint={t("hr.p.adoptionHint", { n: a.activeThisMonth })} />
        <StatCard icon={PiggyBank} label={t("hr.p.saved")} value={fmt(a.totalSaved)} tone="amber" delay={0.1} hint={t("hr.p.discCash")} />
        <StatCard icon={Activity} label={t("hr.p.offersUsed")} value={a.redemptionCount} tone="rose" delay={0.15} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("hr.p.adoptionChart")}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="rate" name={t("hr.p.adoptionName")} stroke="#10B981" fill="url(#adoptionGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title={t("hr.p.savingsChart")}>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.map((m) => ({ ...m, savedDisplay: Math.round(money.fromUsd(m.saved, currency)) }))}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v) => money.formatIn(v, currency)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="savedDisplay" name={t("hr.p.savingsName")} fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
      <p className="mt-3 text-right text-sm"><Link to="/hr-savings-report" className="font-medium text-emerald-600 hover:underline">{t("hr.p.detail")}</Link></p>
      </>)}

      {show("benefits") && <div className="mt-6"><BenefitsBuilder /></div>}

      {show("invitations") && <div className="mt-6"><InviteEmployees /></div>}

      {show("employees") && (
      <SectionCard title={t("hr.p.staff")} className="mt-6" action={
        <div className="relative w-36 sm:w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} aria-label={t("hr.p.searchAria")} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
      }>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title={t("hr.p.noStaff")} description={t("hr.p.noStaffDesc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t("hr.p.colName")}</th>
                  <th className="pb-3 font-medium">{t("hr.p.colDept")}</th>
                  <th className="pb-3 font-medium">{t("hr.p.colRole")}</th>
                  <th className="pb-3 font-medium">{t("hr.p.colSaved")}</th>
                  <th className="pb-3 font-medium">{t("hr.p.colStatus")}</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const stats = a.perEmployee?.get(e.id);
                  return (
                    <tr key={e.id} className="border-b border-slate-50">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{e.full_name || "—"}</p>
                        <p className="text-xs text-slate-400">{e.email}</p>
                      </td>
                      <td className="py-3">
                        <input defaultValue={e.department || ""} onBlur={(ev) => setDepartment(e, ev.target.value)} placeholder="—" aria-label={t("hr.p.colDept")} className="w-32 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none" />
                      </td>
                      <td className="py-3 text-slate-600">{e.role === "HR_ADMIN" ? t("hr.p.roleHr") : t("hr.p.roleEmp")}</td>
                      <td className="py-3 text-slate-700">{fmt(stats?.saved || 0)}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-xs ${e.onboarded ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{e.onboarded ? t("hr.p.active") : t("hr.p.pending")}</span></td>
                      <td className="py-3 text-right">
                        {e.id !== user.id && (
                          <button onClick={() => remove(e)} disabled={busyId === e.id} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50" title={t("hr.p.removeTitle")}>
                            <UserMinus className="h-3.5 w-3.5" /> {t("hr.p.remove")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      )}

      {section === "overview" && a.company && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-amber-900">{t("hr.p.planLine", { plan: plan?.name || a.company.plan_tier, used: a.company.seats_used, max: a.company.max_employees >= 100000 ? "∞" : a.company.max_employees, budget: fmt(a.company.wallet_balance) })}</p>
            <p className="text-sm text-amber-700">{a.company.subscription_status === "TRIAL" ? t("hr.p.trial") : a.company.subscription_status === "ACTIVE" ? t("hr.p.subActive") : t("hr.p.subRenew")}</p>
          </div>
          <Link to="/billing-settings" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">{t("hr.p.manageSub")}</Link>
        </div>
      )}
      </div>
      </>
      )}
      </AccessGate>
    </PortalLayout>
  );
}

