import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { callRpc } from "@/api/rpc";
import { useAuth } from "@/lib/AuthContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useToast } from "@/components/ui/use-toast";
import CurrencySelect from "@/components/CurrencySelect";
import { X, Loader2, Check, CreditCard, Smartphone, Building2, Apple, Wallet, AlertTriangle } from "lucide-react";

const METHODS = [
  { v: "CARD", l: "Carte", icon: CreditCard },
  { v: "MOBILE_MONEY", l: "Mobile Money", icon: Smartphone },
  { v: "APPLE_PAY", l: "Apple Pay", icon: Apple },
  { v: "GOOGLE_PAY", l: "Google Pay", icon: Wallet },
  { v: "BANK_TRANSFER", l: "Virement", icon: Building2 },
];
const QUICK_USD = [10, 25, 50, 100];

const TITLES = {
  RECHARGE: "Recharger mon wallet",
  COMPANY_TOPUP: "Alimenter le budget avantages",
  SUBSCRIPTION: "Souscrire",
  GIFT: "Offrir",
};

/**
 * Hosted checkout through the PSP chosen by the Nelvin router.
 * - purpose RECHARGE / COMPANY_TOPUP: free amount in the chosen currency.
 * - purpose SUBSCRIPTION: fixed plan price; can also be paid from the wallet
 *   (member wallet, or company wallet for an HR plan).
 */
export default function CheckoutModal({ open, onClose, purpose = "RECHARGE", plan = null, cycle = "MONTHLY", gift = null, onPaid }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency, setCurrency] = useState(user?.wallet_currency || "USD");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CARD");
  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDone(null);
    setCurrency(user?.wallet_currency || "USD");
    callRpc("available_payment_methods")
      .then((m) => {
        setAvailable(m || []);
        if (m?.length && !m.includes(method)) setMethod(m[0]);
      })
      .catch(() => setAvailable([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isGift = purpose === "GIFT" && plan;
  const isPlan = (purpose === "SUBSCRIPTION" || isGift) && plan;
  const priceUsd = isPlan ? Number(cycle === "ANNUAL" ? plan.price_annual : plan.price_monthly) : 0;
  const payAmount = isPlan ? money.fromUsd(priceUsd, currency) : Number(amount);
  const companyPlan = isPlan && plan.audience === "B2B";
  const walletLabel = companyPlan ? "Wallet entreprise" : "Mon wallet";

  const close = () => {
    setAmount("");
    onClose?.();
  };

  const payOnline = async () => {
    if (!payAmount || payAmount <= 0) return;
    setLoading(true);
    try {
      const res = await invokeFunction("create-checkout", {
        purpose,
        amount: isPlan ? undefined : payAmount,
        currency,
        method,
        country: user?.country || "",
        plan_code: isPlan ? plan.code : undefined,
        billing_cycle: isPlan ? cycle : undefined,
        ...(isGift ? { recipient_email: gift?.recipient_email || "", recipient_name: gift?.recipient_name || "", message: gift?.message || "" } : {}),
        callback_url: window.location.origin + "/payment-return",
      });
      toast({ title: "Redirection vers le paiement sécurisé…", description: `${res.data.psp} — ${res.data.reason || ""}` });
      window.location.href = res.data.authorization_url;
    } catch (e) {
      toast({ title: "Paiement impossible", description: e.message || "Réessayez.", variant: "destructive" });
      setLoading(false);
    }
  };

  const payWithWallet = async () => {
    setLoading(true);
    try {
      const res = await callRpc("subscribe_with_wallet", { p_plan_code: plan.code, p_cycle: cycle });
      if (res?.ok === false) throw new Error(res.error);
      await refreshUser();
      setDone({ expires_at: res.expires_at });
      onPaid?.(res);
    } catch (e) {
      toast({ title: "Paiement refusé", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const noPsp = available !== null && available.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{isPlan ? `${isGift ? TITLES.GIFT : TITLES.SUBSCRIPTION} · ${plan.name}` : TITLES[purpose]}</h3>
              <button onClick={close} aria-label="Fermer" className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"><Check className="h-7 w-7 text-emerald-600" /></div>
                <p className="mt-3 text-lg font-bold text-slate-900">Abonnement activé</p>
                {done.expires_at && <p className="mt-1 text-sm text-slate-500">Valable jusqu'au {new Date(done.expires_at).toLocaleDateString("fr-FR")}</p>}
                <button onClick={close} className="mt-5 w-full rounded-full bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">Terminer</button>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-700" htmlFor="checkout-amount">Montant</label>
                    {isPlan ? (
                      <p id="checkout-amount" className="mt-2 text-2xl font-bold text-slate-900">{money.formatIn(payAmount, currency)}</p>
                    ) : (
                      <input id="checkout-amount" type="number" min="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-500" />
                    )}
                  </div>
                  <CurrencySelect value={currency} onChange={setCurrency} />
                </div>
                {!isPlan && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {QUICK_USD.map((q) => {
                      const v = Math.round(money.fromUsd(q, currency));
                      return (
                        <button key={q} onClick={() => setAmount(String(v))} className="not-pill rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700">
                          {v.toLocaleString("fr-FR")}
                        </button>
                      );
                    })}
                  </div>
                )}
                {currency !== "USD" && payAmount > 0 && (
                  <p className="mt-2 text-xs text-slate-500">≈ {money.format(money.toUsd(payAmount, currency), "USD")} · taux Nelvin du jour</p>
                )}

                {isPlan && !isGift && (
                  <button onClick={payWithWallet} disabled={loading} className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">
                    <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Payer avec {walletLabel.toLowerCase()}</span>
                    <span>{money.format(priceUsd, "USD")}</span>
                  </button>
                )}

                <p className="mt-5 text-sm font-medium text-slate-700">{isPlan && !isGift ? "Ou payer en ligne" : "Méthode de paiement"}</p>
                {noPsp ? (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Le paiement en ligne n'est pas encore activé. Contactez le support ou réessayez plus tard.
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {METHODS.filter((m) => !available || available.includes(m.v)).map((m) => {
                      const Icon = m.icon;
                      const active = method === m.v;
                      return (
                        <button key={m.v} onClick={() => setMethod(m.v)} className={`not-pill flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-medium ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                          <Icon className="h-5 w-5" /> {m.l}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button onClick={payOnline} disabled={loading || noPsp || !payAmount || payAmount <= 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-95">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Traitement…</> : <>Payer {payAmount > 0 ? money.formatIn(payAmount, currency) : ""}</>}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-400">Paiement sécurisé chez notre partenaire de paiement. Aucune donnée bancaire n'est stockée par Nelvin.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
