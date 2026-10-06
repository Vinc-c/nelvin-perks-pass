import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import MerchantStatusGate from "@/components/merchant/MerchantStatusGate";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { invokeFunction } from "@/api/functions";
import { callRpc } from "@/api/rpc";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import CurrencySelect from "@/components/CurrencySelect";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/UiFeedback";
import { ScanLine, Tag, Wallet, TrendingUp, Plus, Check, Loader2, Star, Banknote, X } from "lucide-react";

const REASONS = {
  ALREADY_USED: "Code déjà utilisé",
  EXPIRED: "Code expiré — demandez au membre d'en générer un nouveau",
  MERCHANT_REQUIRED: "Compte marchand vérifié requis",
  AMOUNT_REQUIRED: "Saisissez le montant de l'addition",
  INSUFFICIENT_FUNDS: "Solde du wallet du membre insuffisant — encaissez autrement",
  WALLET_NOT_AUTHORIZED: "Le membre n'a pas autorisé le paiement par wallet pour ce code",
  CURRENCY: "Devise non prise en charge",
  INVALID: "Code invalide",
};
const PAYOUT_STATUS = { PENDING: ["En traitement", "bg-amber-100 text-amber-700"], PAID: ["Payé", "bg-emerald-100 text-emerald-700"], REJECTED: ["Refusé", "bg-rose-100 text-rose-700"] };

export default function MerchantPortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const merchantId = user?.merchant_id;
  const { meta } = useCategories();

  const [merchant, setMerchant] = useState(null);
  const [offers, setOffers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [bill, setBill] = useState("");
  const [billCurrency, setBillCurrency] = useState(currency);
  const [payWallet, setPayWallet] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payout, setPayout] = useState({ amount: "", method: "MOBILE_MONEY", destination: "" });
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  const load = async () => {
    if (!merchantId) return;
    const [mer, off, red, pay] = await Promise.all([
      entities.Merchant.get(merchantId).catch(() => null),
      entities.Offer.filter({ merchant_id: merchantId }, "-created_date", 100),
      entities.Redemption.filter({ merchant_id: merchantId }, "-created_date", 200),
      entities.PayoutRequest.filter({ merchant_id: merchantId }, "-created_date", 50).catch(() => []),
    ]);
    setMerchant(mer);
    setOffers(off || []);
    setRedemptions(red || []);
    setPayouts(pay || []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!merchantId) { setLoading(false); return; }
      setLoading(true);
      try { await load(); } catch { /* shown as empty */ }
      if (alive) setLoading(false);
    })();
    const unsub = merchantId ? entities.Redemption.subscribe(() => load().catch(() => {}), { filter: `merchant_id=eq.${merchantId}` }) : () => {};
    return () => { alive = false; unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  const redeemed = useMemo(() => redemptions.filter((r) => r.status === "REDEEMED"), [redemptions]);
  const todayStr = new Date().toDateString();
  const todays = redeemed.filter((r) => new Date(r.redeemed_at).toDateString() === todayStr);
  const salesToday = todays.reduce((s, r) => s + Number(r.bill_amount_usd || 0), 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const month = redeemed.filter((r) => new Date(r.redeemed_at) >= monthStart);
  const salesMonth = month.reduce((s, r) => s + Number(r.bill_amount_usd || 0), 0);
  const avgBasket = month.length ? salesMonth / month.length : 0;
  const payoutBalance = Number(merchant?.payout_balance || 0);

  const validateCode = async (e) => {
    e?.preventDefault();
    if (!code.trim() || !(Number(bill) > 0)) return;
    setValidating(true);
    setScanResult(null);
    try {
      const res = await invokeFunction("validate-redemption", {
        code: code.trim(), bill_amount: Number(bill), bill_currency: billCurrency, pay_with_wallet: payWallet,
      });
      const d = res.data || {};
      if (d.ok) {
        setScanResult({ valid: true, ...d, currency: billCurrency });
        setCode("");
        setBill("");
        setPayWallet(false);
        await load();
      } else {
        setScanResult({ valid: false, reason: REASONS[d.reason] || d.error || "Code invalide" });
      }
    } catch (err) {
      setScanResult({ valid: false, reason: err.message || "Erreur de validation" });
    } finally {
      setValidating(false);
    }
  };

  const requestPayout = async (e) => {
    e.preventDefault();
    setPayoutBusy(true);
    try {
      const usd = money.toUsd(Number(payout.amount), currency);
      await callRpc("merchant_request_payout", { p_amount_usd: Math.round(usd * 100) / 100, p_method: payout.method, p_destination: payout.destination });
      toast({ title: "Demande envoyée", description: "Nelvin traite les paiements sous 48 h ouvrées." });
      setPayoutOpen(false);
      setPayout({ amount: "", method: "MOBILE_MONEY", destination: "" });
      await load();
    } catch (err) {
      toast({ title: "Demande impossible", description: err.message, variant: "destructive" });
    } finally {
      setPayoutBusy(false);
    }
  };

  return (
    <PortalLayout title={t("portal.merchant.title")} theme="light">
      <MerchantStatusGate>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
        <>
        <RoleWelcomeHeader />
        <div className="[&>*:first-child]:mt-0">
        {show("payout") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ScanLine} label="Codes validés aujourd'hui" value={todays.length} tone="emerald" />
          <StatCard icon={TrendingUp} label="Ventes Nelvin aujourd'hui" value={money.format(salesToday, currency)} tone="amber" delay={0.05} />
          <StatCard icon={Wallet} label="Solde à reverser" value={money.format(payoutBalance, currency)} tone="blue" delay={0.1} hint="Paiements reçus via wallet Nelvin" />
          <StatCard icon={Tag} label="Panier moyen (mois)" value={money.format(avgBasket, currency)} tone="rose" delay={0.15} />
        </div>
        )}

        {(show("scan") || show("redemptions")) && (
        <div className={`mt-6 grid gap-4 ${section === "overview" ? "lg:grid-cols-2" : ""}`}>
          {show("scan") && (
          <SectionCard title="Validation des codes" icon={ScanLine}>
            <form onSubmit={validateCode} className="space-y-3">
              <label className="block text-sm text-slate-600">
                Code présenté par le membre
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NEL-XXXXXX" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-emerald-500" />
              </label>
              <div className="flex items-end gap-2">
                <label className="block flex-1 text-sm text-slate-600">
                  Montant de l'addition
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
                </label>
                <CurrencySelect value={billCurrency} onChange={setBillCurrency} />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={payWallet} onChange={(e) => setPayWallet(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-500" />
                Le membre paie avec son wallet Nelvin (le montant net vous sera reversé)
              </label>
              <button type="submit" disabled={validating || !code.trim() || !(Number(bill) > 0)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Valider
              </button>
            </form>
            {scanResult && (
              <div className={`mt-3 rounded-lg p-3 text-sm ${scanResult.valid ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
                {scanResult.valid ? (
                  <>
                    <p className="font-semibold">✓ {scanResult.offer_title}</p>
                    <p>Addition {money.format(scanResult.bill_usd, scanResult.currency)} · remise {money.format(scanResult.discount_applied, scanResult.currency)} · <strong>à encaisser {money.format(scanResult.net_usd, scanResult.currency)}</strong></p>
                    <p className="text-xs">{scanResult.paid_with_wallet ? "Payé avec le wallet du membre — montant ajouté à votre solde." : "À encaisser par vos moyens habituels."} Cashback membre : {money.format(scanResult.cashback_credited, scanResult.currency)}.</p>
                  </>
                ) : scanResult.reason}
              </div>
            )}
          </SectionCard>
          )}

          {show("redemptions") && (
          <SectionCard title="Codes validés" icon={TrendingUp}>
            {redeemed.length === 0 ? (
              <EmptyState icon={ScanLine} title="Aucune validation" description="Les codes validés apparaissent ici en temps réel." />
            ) : (
              <div className="space-y-2">
                {redeemed.slice(0, 12).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900">{s.code_used}</p>
                      <p className="text-xs text-slate-500">{new Date(s.redeemed_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{s.paid_with_wallet ? " · wallet" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{money.format(s.net_amount_usd ?? s.bill_amount_usd, currency)}</p>
                      <p className="text-xs text-slate-500">remise {money.format(s.discount_applied, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
          )}
        </div>
        )}

        {show("offers") && (
        <SectionCard className="mt-6" title="Offres & campagnes" action={
          <Link to="/campaign-editor" className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 active:scale-95">
            <Plus className="h-4 w-4" /> Nouvelle offre
          </Link>
        }>
          {offers.length === 0 ? (
            <EmptyState icon={Tag} title="Aucune offre" description="Créez votre première offre pour attirer des membres." action={<Link to="/campaign-editor" className="not-pill rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">+ Créer une offre</Link>} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((c) => {
                const cmeta = meta(c.category);
                const reds = redeemed.filter((r) => r.offer_id === c.id).length;
                const active = !c.expires_at || new Date(c.expires_at) >= new Date();
                return (
                  <div key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="relative h-20 bg-slate-100">
                      {c.image_url ? <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Tag className="h-5 w-5" /></div>}
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700">{cmeta.emoji} {cmeta.label}</span>
                      {c.is_featured && <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"><Star className="inline h-2.5 w-2.5" /></span>}
                      <span className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${active ? "bg-emerald-500" : "bg-slate-500"}`}>{active ? "active" : "expirée"}</span>
                    </div>
                    <div className="p-3">
                      <p className="truncate font-medium text-slate-900">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.target_audience === "ALL" ? "B2B + B2C" : c.target_audience === "B2C" ? "Particuliers" : "Salariés"}</p>
                      <p className="mt-1 text-sm text-slate-600">{reds} utilisation{reds > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
        )}

        {show("payout") && (
        <SectionCard className="mt-6" icon={Banknote} title="Paiements" action={
          <div className="flex items-center gap-2">
            <CurrencySelect value={currency} onChange={setCurrency} />
            <button onClick={() => setPayoutOpen(true)} disabled={payoutBalance <= 0} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">Demander un paiement</button>
          </div>
        }>
          <p className="text-sm text-slate-600">Solde disponible : <span className="font-semibold text-slate-900">{money.format(payoutBalance, currency)}</span> — montants payés par les membres avec leur wallet Nelvin.</p>
          {payouts.length > 0 && (
            <div className="mt-4 space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="text-slate-600">{new Date(p.created_date).toLocaleDateString("fr-FR")} · {p.method === "MOBILE_MONEY" ? "Mobile Money" : "Virement"} · {p.destination}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{money.format(p.amount_usd, currency)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PAYOUT_STATUS[p.status][1]}`}>{PAYOUT_STATUS[p.status][0]}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        )}
        </div>

        {payoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPayoutOpen(false)}>
            <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} onSubmit={requestPayout} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Demander un paiement</h3>
                <button type="button" onClick={() => setPayoutOpen(false)} aria-label="Fermer"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <p className="text-sm text-slate-500">Disponible : {money.format(payoutBalance, currency)}</p>
              <input type="number" min="1" step="0.01" required value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: e.target.value })} placeholder={`Montant (${currency})`} aria-label="Montant" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              <select value={payout.method} onChange={(e) => setPayout({ ...payout, method: e.target.value })} aria-label="Méthode" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
              </select>
              <input required minLength={6} value={payout.destination} onChange={(e) => setPayout({ ...payout, destination: e.target.value })} placeholder={payout.method === "MOBILE_MONEY" ? "Numéro Mobile Money" : "IBAN / numéro de compte"} aria-label="Destination" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
              <button type="submit" disabled={payoutBusy || money.toUsd(Number(payout.amount), currency) > payoutBalance + 1e-6} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {payoutBusy && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer la demande
              </button>
            </motion.form>
          </div>
        )}
        </>
        )}
      </MerchantStatusGate>
    </PortalLayout>
  );
}
