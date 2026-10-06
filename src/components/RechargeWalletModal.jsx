import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { routePayment } from "@/lib/paymentRouter";
import { useToast } from "@/components/ui/use-toast";
import { X, Loader2, Check, CreditCard, Smartphone, Building2, Apple, Wallet } from "lucide-react";

const METHODS = [
  { v: "CARD", l: "Carte", icon: CreditCard },
  { v: "MOBILE_MONEY", l: "Mobile Money", icon: Smartphone },
  { v: "APPLE_PAY", l: "Apple Pay", icon: Apple },
  { v: "GOOGLE_PAY", l: "Google Pay", icon: Wallet },
  { v: "BANK_TRANSFER", l: "Virement", icon: Building2 },
];
const QUICK = [10, 25, 50, 100];

export default function RechargeWalletModal({ open, onClose, currency = "USD", country = "" }) {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CARD");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const preview = routePayment({ audience: "B2C", method, country });

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setLoading(true);
    setDone(null);
    try {
      const callback_url = window.location.origin + "/payment-return";
      const res = await invokeFunction("recharge-wallet", { amount: amt, method, currency, country, callback_url });
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "Redirection…", description: `${res.data.psp} — ${res.data.reason || ""}` });
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
        return;
      }
      setDone({ psp: res.data.psp, balance: res.data.balance, amt });
      await refreshUser();
    } catch (e) {
      toast({ title: "Échec de la recharge", description: e.message || "Réessayez.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const close = () => { setDone(null); setAmount(""); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recharger mon wallet</h3>
              <button onClick={close} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            {done ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"><Check className="h-7 w-7 text-emerald-600" /></div>
                <p className="mt-3 text-lg font-bold text-slate-900">+{currency} {Number(done.amt).toFixed(2)}</p>
                <p className="mt-1 text-sm text-slate-500">Traités via <span className="font-semibold text-slate-700">{done.psp}</span> · Nouveau solde : {currency} {Number(done.balance).toFixed(2)}</p>
                <button onClick={close} className="mt-5 w-full rounded-full bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">Terminer</button>
              </div>
            ) : (
              <>
                <label className="text-sm font-medium text-slate-700">Montant ({currency})</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3">
                  <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent py-2.5 text-lg font-semibold text-slate-900 outline-none" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => setAmount(String(q))} className="not-pill rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700">{q}</button>
                  ))}
                </div>

                <p className="mt-5 text-sm font-medium text-slate-700">Méthode de paiement</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = method === m.v;
                    return (
                      <button key={m.v} onClick={() => setMethod(m.v)} className={`not-pill flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-medium ${active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <Icon className="h-5 w-5" /> {m.l}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">PSP Nelvin : </span>{preview.primary.name}
                  <p className="text-xs text-slate-500">{preview.reason}</p>
                </div>

                <button onClick={submit} disabled={loading || !amount || Number(amount) <= 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 active:scale-95">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Traitement…</> : <>Recharger{amount ? ` ${currency} ${Number(amount).toFixed(2)}` : ""}</>}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}