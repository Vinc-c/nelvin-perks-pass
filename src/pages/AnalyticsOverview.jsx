import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import CurrencySelect from "@/components/CurrencySelect";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { Spinner, EmptyState } from "@/components/UiFeedback";
import { useI18n } from "@/i18n/I18nContext";
import { Users, TrendingUp, Store, Wallet, ScanLine, Tag, Crown, BarChart3, Building2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const monthLabel = (key, locale = "en-US") => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "short" });
};

function AdminAnalytics({ money, currency }) {
  const { data: s, loading } = useAsync(() => callRpc("admin_platform_stats"), []);
  if (loading || !s) return <Spinner />;
  const monthly = (s.monthly || []).map((m) => ({
    label: monthLabel(m.month),
    revenue: Math.round(money.fromUsd(m.revenue_usd, currency)),
    savings: Math.round(money.fromUsd(Number(m.savings_usd) + Number(m.cashback_usd), currency)),
    redemptions: m.redemptions,
    signups: m.signups,
  }));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Users" value={s.users_total} tone="blue" hint={`${s.users?.MEMBER || 0} members · ${s.users?.EMPLOYEE || 0} employees`} />
        <StatCard icon={Building2} label="Companies" value={s.companies} tone="emerald" delay={0.05} hint={`${s.companies_active} active · ${s.companies_trial} on trial`} />
        <StatCard icon={Store} label="Verified partners" value={s.merchants?.VERIFIED || 0} tone="amber" delay={0.1} hint={`${s.pending_merchants} pending`} />
        <StatCard icon={Crown} label="Subscription revenue (30d)" value={money.format(s.subscription_revenue_30d_usd, currency)} tone="rose" delay={0.15} hint={`${s.active_subscriptions} active subscriptions`} />
        <StatCard icon={ScanLine} label="Offers redeemed (30d)" value={s.redemptions_30d} tone="emerald" />
        <StatCard icon={TrendingUp} label="Gross merchandise volume (30d)" value={money.format(s.gmv_30d_usd, currency)} tone="blue" delay={0.05} />
        <StatCard icon={Tag} label="Member savings (30d)" value={money.format(Number(s.savings_30d_usd) + Number(s.cashback_30d_usd), currency)} tone="amber" delay={0.1} />
        <StatCard icon={Wallet} label="Wallet float" value={money.format(s.wallet_float_usd, currency)} tone="rose" delay={0.15} hint={`Companies ${money.format(s.company_wallets_usd, currency)} · payable to merchants ${money.format(s.merchant_payables_usd, currency)}`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title={`Revenue & savings (${currency})`}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v) => money.formatIn(v, currency)} contentStyle={{ borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8B5CF6" fill="#8B5CF622" strokeWidth={2} />
                <Area type="monotone" dataKey="savings" name="Member savings" stroke="#10B981" fill="#10B98122" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Sign-ups & redemptions">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="signups" name="Sign-ups" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="redemptions" name="Offers redeemed" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function MerchantAnalytics({ user, money, currency }) {
  const { t, locale } = useI18n();
  const { data, loading } = useAsync(async () => {
    const [reds, offers] = await Promise.all([
      entities.Redemption.filter({ merchant_id: user.merchant_id, status: "REDEEMED" }, "-redeemed_at", 5000),
      entities.Offer.filter({ merchant_id: user.merchant_id }, "title"),
    ]);
    return { reds, offers };
  }, [user?.merchant_id]);

  const stats = useMemo(() => {
    if (!data) return null;
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, sales: 0, count: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    data.reds.forEach((r) => {
      const m = byKey.get(String(r.redeemed_at).slice(0, 7));
      if (m) { m.sales += Number(r.bill_amount_usd || 0); m.count += 1; }
    });
    const byOffer = data.offers.map((o) => {
      const list = data.reds.filter((r) => r.offer_id === o.id);
      return { title: o.title, count: list.length, sales: list.reduce((s, r) => s + Number(r.bill_amount_usd || 0), 0) };
    }).sort((a, b) => b.count - a.count);
    const customers = new Set(data.reds.map((r) => r.user_id)).size;
    const repeat = (() => {
      const c = new Map();
      data.reds.forEach((r) => c.set(r.user_id, (c.get(r.user_id) || 0) + 1));
      return [...c.values()].filter((n) => n > 1).length;
    })();
    return {
      months: months.map((m) => ({ label: monthLabel(m.key, locale), sales: Math.round(money.fromUsd(m.sales, currency)), count: m.count })),
      total: data.reds.reduce((s, r) => s + Number(r.bill_amount_usd || 0), 0),
      count: data.reds.length,
      customers,
      repeat,
      walletShare: data.reds.length ? Math.round((data.reds.filter((r) => r.paid_with_wallet).length / data.reds.length) * 100) : 0,
      byOffer,
    };
  }, [data, money, currency, locale]);

  if (loading || !stats) return <Spinner />;
  if (stats.count === 0) return <EmptyState icon={BarChart3} title={t("mc.an.noSales")} description={t("mc.an.noSalesDesc")} />;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label={t("mc.an.sales")} value={money.format(stats.total, currency)} tone="emerald" />
        <StatCard icon={ScanLine} label={t("mc.an.codes")} value={stats.count} tone="amber" delay={0.05} />
        <StatCard icon={Users} label={t("mc.an.customers")} value={stats.customers} tone="blue" delay={0.1} hint={t("mc.an.repeat", { n: stats.repeat })} />
        <StatCard icon={Wallet} label={t("mc.an.wallet")} value={`${stats.walletShare}%`} tone="rose" delay={0.15} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("mc.an.byMonth", { currency })}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.months}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v, n) => (n === t("mc.an.salesName") ? money.formatIn(v, currency) : v)} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="sales" name={t("mc.an.salesName")} fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title={t("mc.an.byOffer")}>
          <div className="space-y-2">
            {stats.byOffer.map((o) => (
              <div key={o.title} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate text-slate-700">{o.title}</span>
                <span className="shrink-0 font-medium text-slate-900">{o.count} · {money.format(o.sales, currency)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

export default function AnalyticsOverview() {
  const { user } = useAuth();
  const { t } = useI18n();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();

  if (user?.role === "HR_ADMIN" && !isAdmin(user)) return <Navigate to="/hr-savings-report" replace />;

  return (
    <PortalLayout title={t("mc.an.title")} theme="light">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{isAdmin(user) ? "Platform analytics" : t("mc.an.mine")}</h1>
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>
      {isAdmin(user) ? (
        <AdminAnalytics money={money} currency={currency} />
      ) : user?.merchant_id ? (
        <MerchantAnalytics user={user} money={money} currency={currency} />
      ) : (
        <EmptyState icon={BarChart3} title={t("mc.an.unavail")} description={t("mc.an.unavailDesc")} />
      )}
    </PortalLayout>
  );
}
