import React, { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2, X, CheckCircle2, Wallet } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import CurrencySelect from "@/components/CurrencySelect";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { useI18n } from "@/i18n/I18nContext";

const REASON_KEYS = {
  BAD_PIN: "mb.pin.reason.BAD_PIN",
  TOO_MANY_ATTEMPTS: "mb.pin.reason.TOO_MANY_ATTEMPTS",
  NO_PIN: "mb.pin.reason.NO_PIN",
  LIMIT_REACHED: "mb.pin.reason.LIMIT_REACHED",
  AMOUNT_REQUIRED: "mb.pin.reason.AMOUNT_REQUIRED",
  INSUFFICIENT_FUNDS: "mb.pin.reason.INSUFFICIENT_FUNDS",
  EXPIRED: "mb.pin.reason.EXPIRED",
  MERCHANT_INACTIVE: "mb.pin.reason.MERCHANT_INACTIVE",
  B2B_ONLY: "mb.pin.reason.B2B_ONLY",
  ACCESS: "mb.pin.reason.ACCESS",
  CURRENCY: "mb.pin.reason.CURRENCY",
  INVALID: "mb.pin.reason.INVALID",
};

/**
 * Validation on the member's phone: the member enters the bill, hands the
 * phone to the partner, who types their counter PIN. Discount and cashback
 * are computed server-side.
 */
export default function PinRedemption({ offer, merchantName, onClose, onDone }) {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const money = useCurrencies();
  const [displayCurrency] = useDisplayCurrency();
  const [step, setStep] = useState("bill");
  const [bill, setBill] = useState("");
  const [currency, setCurrency] = useState(displayCurrency || "USD");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const submit = async (value = pin) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await invokeFunction("redeem-with-pin", {
        offer_id: offer.id, pin: value, bill_amount: Number(bill), bill_currency: currency, pay_with_wallet: payWithWallet,
      });
      if (!data?.ok) {
        setError(REASON_KEYS[data?.reason] ? t(REASON_KEYS[data?.reason]) : data?.error || t("mb.pin.refused"));
        setPin("");
        if (data?.reason !== "BAD_PIN") setStep("bill");
        return;
      }
      setResult(data);
      setStep("done");
      refreshUser?.().catch(() => {});
      onDone?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const fmt = (usd) => money.format(usd, currency);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center" onClick={onClose}>
      <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label={t("mb.pin.dialog")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 font-semibold text-slate-900"><KeyRound className="h-5 w-5 text-emerald-600" /> {t("mb.pin.title")}</p>
            <p className="text-xs text-slate-500">{offer.title} · {merchantName}</p>
          </div>
          <button onClick={onClose} aria-label={t("mb.common.close")} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {step === "bill" && (
          <form onSubmit={(e) => { e.preventDefault(); if (Number(bill) > 0) { setError(""); setStep("pin"); } }} className="mt-4 space-y-3">
            <label className="block text-sm text-slate-600">
              {t("mb.pin.billAmount")}
              <div className="mt-1 flex gap-2">
                <input type="number" min="0" step="0.01" inputMode="decimal" autoFocus required value={bill} onChange={(e) => setBill(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-lg" />
                <CurrencySelect value={currency} onChange={setCurrency} />
              </div>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={payWithWallet} onChange={(e) => setPayWithWallet(e.target.checked)} className="mt-0.5 accent-emerald-500" />
              <span><Wallet className="mr-1 inline h-4 w-4" /> {t("mb.pin.payWallet", { balance: money.format(user?.wallet_balance || 0, currency) })}</span>
            </label>
            <button type="submit" disabled={!(Number(bill) > 0)} className="w-full rounded-xl bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600 disabled:opacity-50">{t("mb.pin.continue")}</button>
          </form>
        )}

        {step === "pin" && (
          <div className="mt-4 space-y-4 text-center">
            <p className="text-sm text-slate-600">{t("mb.pin.handPhone")}</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={pin} onChange={setPin} autoFocus inputMode="numeric" pattern="[0-9]*">
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-slate-400">{t("mb.pin.digits")}</p>
            <div className="flex gap-2">
              <button onClick={() => { setStep("bill"); setPin(""); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">{t("mb.pin.back")}</button>
              <button onClick={() => submit()} disabled={busy || pin.length < 4} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("mb.pin.validate")}
              </button>
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="mt-4 space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="text-lg font-bold text-slate-900">{t("mb.pin.validated")}</p>
            <dl className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t("mb.pin.bill")}</dt><dd>{fmt(result.bill_usd)}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt>{t("mb.pin.saving")}</dt><dd className="font-semibold">-{fmt(result.discount_applied)}</dd></div>
              <div className="flex justify-between font-semibold text-slate-900"><dt>{t("mb.pin.toPay")}</dt><dd>{fmt(result.net_usd)}{result.paid_with_wallet ? ` (${t("mb.pin.walletTag")})` : ""}</dd></div>
              {Number(result.cashback_credited) > 0 && <div className="flex justify-between text-amber-700"><dt>{t("mb.pin.cashbackCredited")}</dt><dd>+{fmt(result.cashback_credited)}</dd></div>}
            </dl>
            <p className="text-xs text-slate-400">{t("mb.pin.ref", { code: result.code })}</p>
            <button onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white">{t("mb.pin.finish")}</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
