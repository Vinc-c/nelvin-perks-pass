import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { Spinner } from "@/components/UiFeedback";
import {
  Building2, Shield, Users, Store, Tag, Receipt, PiggyBank, Wallet, Banknote,
  Crown, FileCheck2, LifeBuoy, ArrowUpRight, TrendingUp,
} from "lucide-react";

const TONE = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  purple: "bg-purple-50 text-purple-600",
  slate: "bg-slate-100 text-slate-600",
};

function Card({ icon: Icon, label, value, hint, tone = "slate", to }) {
  const body = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE[tone]}`}><Icon className="h-5 w-5" /></div>
        {to && <ArrowUpRight className="h-4 w-4 text-slate-300" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

/** Super admin dashboard: live platform figures from `admin_platform_stats()`. */
export default function AdminOverview() {
  const { format } = useCurrencies();
  const { data: s, loading, error } = useAsync(() => callRpc("admin_platform_stats"), []);

  if (loading && !s) return <Spinner />;
  if (error) return <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error.message}</p>;

  if (!s) return <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Statistics are currently unavailable. Reload the page.</p>;
  const users = s.users || {};
  const merchants = s.merchants || {};
  const n = (v) => Number(v || 0).toLocaleString("en-US");
  const usd = (v) => format(v, "USD");
  const actions = [
    { label: "Withdrawals to process", value: s.pending_withdrawals, to: "/admin?section=payments", icon: Wallet },
    { label: "Partner payouts", value: s.pending_payouts, to: "/admin?section=payments", icon: Banknote },
    { label: "Partners to verify", value: s.pending_merchants, to: "/admin?section=kyc", icon: Shield },
    { label: "KYC documents", value: s.pending_kyc_docs, to: "/admin?section=kyc", icon: FileCheck2 },
    { label: "Open tickets", value: s.open_tickets, to: "/support-center", icon: LifeBuoy },
  ];
  const monthly = (s.monthly || []).map((m) => ({
    month: m.month.slice(2),
    Savings: Number(m.savings_usd),
    Cashback: Number(m.cashback_usd),
    Subscriptions: Number(m.revenue_usd),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-500">Live platform figures across all companies (amounts in USD).</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {actions.map((a) => (
          <Link key={a.label} to={a.to} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${Number(a.value) > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <a.icon className={`h-4 w-4 ${Number(a.value) > 0 ? "text-amber-600" : "text-slate-400"}`} />
            <span className="flex-1 text-slate-700">{a.label}</span>
            <span className="font-bold text-slate-900">{n(a.value)}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} tone="blue" label="Users" value={n(s.users_total)} hint={`${n(users.MEMBER)} members · ${n(users.EMPLOYEE)} employees · ${n(users.HR_ADMIN)} HR · ${n(users.MERCHANT)} partners`} />
        <Card icon={Building2} tone="emerald" label="Companies" value={n(s.companies)} hint={`${n(s.companies_active)} active · ${n(s.companies_trial)} on trial`} to="/admin?section=companies" />
        <Card icon={Store} tone="rose" label="Verified partners" value={n(merchants.VERIFIED)} hint={`${n(merchants.PENDING)} pending · ${n(merchants.REJECTED)} rejected`} to="/admin?section=kyc" />
        <Card icon={Tag} tone="purple" label="Published offers" value={n(s.offers)} />
        <Card icon={Receipt} tone="slate" label="Validated purchases (30d)" value={n(s.redemptions_30d)} hint={`Volume: ${usd(s.gmv_30d_usd)}`} />
        <Card icon={PiggyBank} tone="emerald" label="Member savings (30d)" value={usd(s.savings_30d_usd)} hint={`Cashback paid: ${usd(s.cashback_30d_usd)}`} />
        <Card icon={TrendingUp} tone="blue" label="Subscription revenue (30d)" value={usd(s.subscription_revenue_30d_usd)} hint={`${n(s.active_subscriptions)} active subscriptions`} to="/admin?section=payments" />
        <Card icon={Crown} tone="amber" label="Funds held" value={usd(Number(s.wallet_float_usd) + Number(s.company_wallets_usd))} hint={`Member wallets ${usd(s.wallet_float_usd)} · companies ${usd(s.company_wallets_usd)} · owed to partners ${usd(s.merchant_payables_usd)}`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Last 12 months (USD)</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => usd(v)} />
              <Legend />
              <Bar dataKey="Subscriptions" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cashback" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
