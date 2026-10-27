import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useToast } from "@/components/ui/use-toast";
import CurrencySelect from "@/components/CurrencySelect";
import { useI18n } from "@/i18n/I18nContext";
import { X, Loader2, Check, Smartphone, Building2, Clock } from "lucide-react";

const METHODS = [
  { v: "MOBILE_MONEY", l: "Mobile Money", icon: Smartphone, placeholder: "mb.wd.momoPh" },
  { v: "BANK_TRANSFER", l: "mb.wd.bank", icon: Building2, placeholder: "mb.wd.bankPh" },
];

/**
 * Withdrawal request. The amount is reserved on the wallet immediately and
 * Nelvin's finance team sends the funds (Admin → Paiements); a rejected
 * request is refunded automatically.
 */
export default function WithdrawWalletModal({ open, onClose }) {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency, setCurrency] = useState(user?.wallet_currency || "USD");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [destination, setDestination] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (open) {
      setDone(null);
      setCurrency(user?.wallet_currency || "USD");
    }
  }, [open]);

  const balanceUsd = Number(user?.wallet_balance || 0);
  const amt = Number(amount);
  const amtUsd = money.toUsd(amt, currency);
  const tooMuch = amtUsd > balanceUsd + 1e-6;

  const submit = async () => {
    if (!amt || amt <= 0 || tooMuch) return;
    setLoading(true);
    try {
      const res = await invokeFunction("withdraw-wallet", { amount: amt, method, destination, currency });
      setDone({ amt, currency, balance: res.data.balance });
      await refreshUser();
    } catch (e) {
      toast({ title: t("mb.wd.failed"), description: e.message || t("mb.ret.retry"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setAmount("");
    onClose?.();
  };
  const activeMethod = METHODS.find((m) => m.v === method) || METHODS[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t("mb.wd.title")}</h3>
              <button onClick={close} aria-label={t("mb.common.close")} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100"><Clock className="h-7 w-7 text-amber-600" /></div>
                <p className="mt-3 text-lg font-bold text-slate-900">{t("mb.wd.done")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("mb.wd.doneSub", { amount: money.formatIn(done.amt, done.currency) })}</p>
                <button onClick={close} className="mt-5 w-full rounded-full bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">{t("mb.pin.finish")}</button>
              </div>
            ) : (
              <>
                <div className="mb-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                  {t("mb.wd.balance")} <span className="font-semibold text-slate-900">{money.format(balanceUsd, currency)}</span>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700" htmlFor="withdraw-amount">{t("mb.wd.amount")}</label>
                    <input id="withdraw-amount" type="number" min="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none ${tooMuch ? "border-rose-400" : "border-slate-200 focus:border-emerald-500"}`} />
                  </div>
                  <CurrencySelect value={currency} onChange={setCurrency} />
                </div>
                <button onClick={() => setAmount(String(Math.floor(money.fromUsd(balanceUsd, currency) * 100) / 100))} className="mt-2 text-xs font-medium text-emerald-600 hover:underline">{t("mb.wd.all")}</button>
                {tooMuch && <p className="mt-1 text-xs text-rose-600">{t("mb.wd.tooMuch")}</p>}

                <p className="mt-4 text-sm font-medium text-slate-700">{t("mb.wd.method")}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = method === m.v;
                    return (
                      <button key={m.v} onClick={() => setMethod(m.v)} className={`not-pill flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-medium ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <Icon className="h-5 w-5" /> {m.l.startsWith("mb.") ? t(m.l) : m.l}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="withdraw-dest">{method === "MOBILE_MONEY" ? t("mb.wd.momoNumber") : t("mb.wd.bankNumber")}</label>
                <input id="withdraw-dest" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t(activeMethod.placeholder)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500" />

                <button onClick={submit} disabled={loading || !amt || amt <= 0 || tooMuch || destination.trim().length < 6} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 active:scale-95">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("mb.wd.processing")}</> : <><Check className="h-4 w-4" /> {t("mb.wd.submit")}</>}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
