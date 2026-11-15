import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, History } from "lucide-react";
import CurrencySelect from "@/components/CurrencySelect";
import { useI18n } from "@/i18n/I18nContext";

/**
 * Wallet panel: balance, primary actions, optional key figures and recent movements.
 * Shared by the member and employee portals so the wallet looks the same everywhere.
 */
export default function WalletHero({ balance, fmt, currency, onCurrency, onRecharge, onWithdraw, stats = [], recent = [], className = "" }) {
  const { t } = useI18n();
  return (
    <section className={`rounded-[20px] border border-slate-200 bg-white ${className}`} aria-label={t("rd.walletBalance")}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">{t("rd.walletBalance")}</span>
          <CurrencySelect value={currency} onChange={onCurrency} tone="light" />
        </div>
        <p className="mt-3 text-[40px] font-medium leading-none tracking-tight text-slate-900 tabular-nums">{fmt(balance)}</p>
        <p className="mt-2 text-sm text-slate-500">{t("rd.available")}</p>
        <div className={`mt-5 grid gap-3 ${onRecharge ? "grid-cols-2" : "grid-cols-1"}`}>
          {onRecharge && (
            <button onClick={onRecharge} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-nv-emerald text-sm font-medium text-white transition hover:bg-nv-deep active:scale-[0.98]">
              <Plus className="h-4 w-4" strokeWidth={1.5} /> {t("wallet.recharge")}
            </button>
          )}
          <button onClick={onWithdraw} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 transition hover:bg-slate-50 active:scale-[0.98]">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} /> {t("wallet.withdraw")}
          </button>
        </div>
      </div>

      {stats.length > 0 && (
        <dl className={`grid divide-x divide-slate-100 border-t border-slate-100 rtl:divide-x-reverse`} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-3">
              <dt className="truncate text-xs text-slate-500">{s.label}</dt>
              <dd className="mt-0.5 truncate text-base font-medium text-slate-900 tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {recent.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">{t("rd.wallet.recent")}</h3>
            <Link to="/wallet-activity?view=tx" className="flex items-center gap-1 text-xs font-medium text-nv-emerald hover:underline"><History className="h-3.5 w-3.5" strokeWidth={1.5} /> {t("mb.portal.seeAll")}</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
                <p className={`shrink-0 text-sm font-medium tabular-nums ${r.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>{r.amount > 0 ? "+" : r.amount < 0 ? "−" : ""}{fmt(Math.abs(r.amount))}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
