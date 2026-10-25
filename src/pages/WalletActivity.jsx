import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { invokeFunction } from "@/api/functions";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import CurrencySelect from "@/components/CurrencySelect";
import StatCard from "@/components/dashboard/StatCard";
import RechargeWalletModal from "@/components/RechargeWalletModal";
import WithdrawWalletModal from "@/components/WithdrawWalletModal";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { translate } from "@/i18n/translate";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Search, Receipt, RefreshCw, Gift, Crown, Banknote, Download } from "lucide-react";

export const TX_LABEL_KEYS = {
  REDEMPTION: "mb.tx.type.REDEMPTION",
  RECHARGE: "mb.tx.type.RECHARGE",
  WITHDRAWAL: "mb.tx.type.WITHDRAWAL",
  SUBSCRIPTION: "mb.tx.type.SUBSCRIPTION",
  PAYOUT: "mb.tx.type.PAYOUT",
  ALLOCATION: "mb.tx.type.ALLOCATION",
  COMPANY_TOPUP: "mb.tx.type.COMPANY_TOPUP",
  REFERRAL_BONUS: "mb.tx.type.REFERRAL_BONUS",
  REFUND: "mb.tx.type.REFUND",
  GIFT: "mb.tx.type.GIFT",
};
// Label of a transaction type, resolved with the given translator (undefined for unknown types).
export const txLabel = (tr, type) => (TX_LABEL_KEYS[type] ? tr(TX_LABEL_KEYS[type]) : undefined);
// Backward-compatible map for consumers outside React: labels resolve at access time.
export const TX_LABELS = Object.defineProperties({}, Object.fromEntries(
  Object.entries(TX_LABEL_KEYS).map(([type, key]) => [type, { enumerable: true, get: () => translate(key) }]),
));
const STATUS_KEYS = { PENDING: "mb.tx.status.PENDING", COMPLETED: "mb.tx.status.COMPLETED", FAILED: "mb.tx.status.FAILED", REFUNDED: "mb.tx.status.REFUNDED", CANCELLED: "mb.tx.status.CANCELLED" };
const STATUS_TONE = { PENDING: "bg-amber-100 text-amber-700", COMPLETED: "bg-emerald-100 text-emerald-700", FAILED: "bg-rose-100 text-rose-700", CANCELLED: "bg-slate-100 text-slate-600", REFUNDED: "bg-blue-100 text-blue-700" };

// Effect of a transaction on the member wallet (USD): + credit, - debit, 0 none.
export function walletEffect(tx) {
  const usd = Number(tx.amount_usd ?? tx.amount ?? 0);
  if (tx.status === "FAILED") return 0;
  switch (tx.type) {
    case "RECHARGE":
    case "ALLOCATION":
    case "REFERRAL_BONUS":
    case "REFUND":
      return tx.status === "COMPLETED" ? usd : 0;
    case "WITHDRAWAL":
      return tx.status === "CANCELLED" ? 0 : -usd;
    case "SUBSCRIPTION":
    case "GIFT":
      return tx.payment_method === "WALLET" && tx.status === "COMPLETED" ? -usd : 0;
    case "REDEMPTION":
      return (tx.payment_method === "WALLET" ? -usd : 0) + Number(tx.cashback_amount || 0);
    default:
      return 0;
  }
}

const FILTERS = [
  { id: "ALL", label: "mb.wallet.filter.all" },
  { id: "REDEMPTION", label: "mb.wallet.filter.offers" },
  { id: "RECHARGE", label: "mb.wallet.filter.recharges" },
  { id: "WITHDRAWAL", label: "mb.wallet.filter.withdrawals" },
  { id: "ALLOCATION", label: "mb.wallet.filter.allocations" },
  { id: "SUBSCRIPTION", label: "mb.wallet.filter.subscriptions" },
];

function iconFor(tx) {
  switch (tx.type) {
    case "RECHARGE": return ArrowDownLeft;
    case "WITHDRAWAL": return ArrowUpRight;
    case "ALLOCATION": return Gift;
    case "SUBSCRIPTION": return Crown;
    case "REFERRAL_BONUS": return Gift;
    case "PAYOUT": return Banknote;
    default: return Receipt;
  }
}

export default function WalletActivity() {
  const { t: tr, locale } = useI18n();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [checking, setChecking] = useState(null);

  const { data: txs, loading, reload } = useAsync(async () => {
    if (!user) return [];
    const [list, merchants] = await Promise.all([
      entities.Transaction.filter({ user_id: user.id }, "-created_date", 300),
      entities.Merchant.list("name", 500).catch(() => []),
    ]);
    const names = new Map(merchants.map((m) => [m.id, m.name]));
    return list.map((t) => ({ ...t, merchant_name: t.merchant_id ? names.get(t.merchant_id) : null }));
  }, [user?.id], { initial: [] });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (txs || [])
      .filter((t) => (filter === "ALL" ? true : t.type === filter))
      .filter((t) => !q || [t.description, t.merchant_name, txLabel(tr, t.type)].some((s) => (s || "").toLowerCase().includes(q)));
  }, [txs, filter, query, tr]);

  const totals = useMemo(() => {
    const done = (txs || []).filter((t) => t.status === "COMPLETED");
    return {
      cashback: done.reduce((s, t) => s + Number(t.cashback_amount || 0), 0),
      savings: done.reduce((s, t) => s + Number(t.savings_usd || 0), 0),
      credited: done.filter((t) => ["RECHARGE", "ALLOCATION", "REFERRAL_BONUS"].includes(t.type)).reduce((s, t) => s + Number(t.amount_usd || 0), 0),
    };
  }, [txs]);

  const recheck = async (tx) => {
    setChecking(tx.id);
    try {
      const res = await invokeFunction("verify-payment", { transaction_id: tx.id });
      if (res.data?.ok) {
        toast({ title: tr("mb.wallet.confirmed") });
        await refreshUser();
      } else {
        toast({ title: tr("mb.wallet.notConfirmed"), description: res.data?.status ? tr("mb.wallet.pspStatus", { status: res.data.status }) : res.data?.error, variant: "destructive" });
      }
      reload();
    } catch (e) {
      toast({ title: tr("mb.wallet.verifyFailed"), description: e.message, variant: "destructive" });
    } finally {
      setChecking(null);
    }
  };

  const exportCsv = () => {
    const header = ["date", "type", "description", tr("mb.wallet.csv.status"), tr("mb.wallet.csv.amount"), tr("mb.wallet.csv.currency"), tr("mb.wallet.csv.amountUsd"), "cashback_usd", tr("mb.wallet.csv.savingsUsd")];
    const lines = rows.map((t) => [
      new Date(t.created_date).toISOString(), t.type, (t.description || t.merchant_name || "").replace(/[";\n]/g, " "),
      t.status, t.amount, t.currency, t.amount_usd ?? "", t.cashback_amount || 0, t.savings_usd || 0,
    ].join(";"));
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nelvin-wallet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <PortalLayout title={tr("mb.wallet.title")} theme="light">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-emerald-50"><Wallet className="h-4 w-4" /> {tr("mb.wallet.available")}</p>
          <p className="mt-2 text-4xl font-bold">{money.format(user?.wallet_balance, currency)}</p>
          {currency !== "USD" && <p className="mt-1 text-xs text-emerald-100">{money.format(user?.wallet_balance, "USD")}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CurrencySelect value={currency} onChange={setCurrency} tone="dark" />
          <button onClick={() => setRechargeOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"><ArrowDownLeft className="h-4 w-4" /> {tr("wallet.recharge")}</button>
          <button onClick={() => setWithdrawOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"><ArrowUpRight className="h-4 w-4" /> {tr("wallet.withdraw")}</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label={tr("wallet.cashback")} value={money.format(totals.cashback, currency)} tone="emerald" />
        <StatCard icon={Gift} label={tr("mb.wallet.savings")} value={money.format(totals.savings, currency)} tone="amber" delay={0.05} />
        <StatCard icon={ArrowDownLeft} label={tr("mb.wallet.credits")} value={money.format(totals.credited, currency)} tone="blue" delay={0.1} hint={tr("mb.wallet.creditsHint")} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f.id ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {tr(f.label)}
            </button>
          ))}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("mb.wallet.search")} aria-label={tr("mb.wallet.searchAria")} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          </div>
          <button onClick={exportCsv} disabled={!rows.length} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Download className="h-4 w-4" /> CSV</button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-4"><ListSkeleton rows={5} /></div>
        ) : rows.length === 0 ? (
          <div className="p-4"><EmptyState icon={Wallet} title={tr("mb.portal.noTx")} description={tr("mb.wallet.emptyDesc")} /></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((tx, i) => {
              const Icon = iconFor(tx);
              const effect = walletEffect(tx);
              const canRecheck = tx.status === "PENDING" && ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP"].includes(tx.type) && tx.psp_reference;
              return (
                <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 10) * 0.02 }} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${effect > 0 ? "bg-emerald-100 text-emerald-600" : effect < 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{tx.merchant_name || tx.description || txLabel(tr, tx.type)}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.created_date).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })} · {txLabel(tr, tx.type) || tx.type}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-semibold ${effect > 0 ? "text-emerald-600" : effect < 0 ? "text-rose-600" : "text-slate-900"}`}>
                      {effect > 0 ? "+" : effect < 0 ? "-" : ""}{money.format(Math.abs(effect) || tx.amount_usd || tx.amount, currency)}
                    </p>
                    {tx.currency && tx.currency !== "USD" && tx.currency !== currency && <p className="text-[11px] text-slate-400">{money.formatIn(tx.amount, tx.currency)}</p>}
                    {Number(tx.savings_usd) > 0 && <p className="text-xs text-amber-600">{tr("mb.portal.saved", { amount: money.format(tx.savings_usd, currency) })}</p>}
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[tx.status] || "bg-slate-100 text-slate-600"}`}>{STATUS_KEYS[tx.status] ? tr(STATUS_KEYS[tx.status]) : tx.status}</span>
                      {canRecheck && (
                        <button onClick={() => recheck(tx)} disabled={checking === tx.id} className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:underline disabled:opacity-50">
                          <RefreshCw className={`h-3 w-3 ${checking === tx.id ? "animate-spin" : ""}`} /> {tr("mb.wallet.verify")}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <RechargeWalletModal open={rechargeOpen} onClose={() => { setRechargeOpen(false); reload(); }} />
      <WithdrawWalletModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); reload(); }} />
    </PortalLayout>
  );
}
