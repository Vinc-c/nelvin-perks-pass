import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import MerchantStatusGate from "@/components/merchant/MerchantStatusGate";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { mockCurrencies } from "@/data/mockData";
import { ScanLine, Tag, Wallet, TrendingUp, Plus, Check, Loader2, Star } from "lucide-react";
import { categoryMeta } from "@/data/offerCategories";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/UiFeedback";

export default function MerchantPortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const merchantId = user?.merchant_id;
  const currency = user?.wallet_currency || "USD";

  const [merchant, setMerchant] = useState(null);
  const [offers, setOffers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!merchantId) { setLoading(false); return; }
      setLoading(true);
      try {
        const [mer, off, red] = await Promise.all([
          base44.entities.Merchant.get(merchantId).catch(() => null),
          base44.entities.Offer.filter({ merchant_id: merchantId }, "-created_date", 50),
          base44.entities.Redemption.filter({ merchant_id: merchantId }, "-created_date", 50),
        ]);
        if (!alive) return;
        setMerchant(mer);
        setOffers(off || []);
        setRedemptions(red || []);
      } catch {
        if (alive) { setMerchant(null); setOffers([]); setRedemptions([]); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [merchantId]);

  const cur = mockCurrencies.find((c) => c.code === currency) || mockCurrencies[0];
  const convert = (v) => Number(v || 0) * (cur?.rate || 1);
  const fmt = (v) => `${cur.symbol}${convert(v).toFixed(2)}`;

  const todayStr = new Date().toDateString();
  const todays = (redemptions || []).filter((r) => r.redeemed_at && new Date(r.redeemed_at).toDateString() === todayStr);
  const scansToday = todays.length;
  const salesToday = todays.reduce((s, r) => s + (r.discount_applied || 0), 0);
  const avgRedemption = scansToday ? salesToday / scansToday : 0;
  const payoutBalance = merchant?.payout_balance ?? 0;

  const validateCode = async () => {
    if (!manualCode.trim()) return;
    setValidating(true);
    setScanResult(null);
    try {
      const res = await base44.functions.invoke("ValidateRedemption", { code: manualCode.trim() });
      const d = res.data || {};
      if (d.ok) {
        // Refresh redemptions + merchant payout balance from server
        if (merchantId) {
          const [red, mer] = await Promise.all([
            base44.entities.Redemption.filter({ merchant_id: merchantId }, "-created_date", 50),
            base44.entities.Merchant.get(merchantId).catch(() => null),
          ]);
          setRedemptions(red || []);
          if (mer) setMerchant(mer);
        }
        setScanResult({ valid: true, code: manualCode, offer: d.offer_title, cashback: d.cashback_credited });
      } else {
        const reason = d.reason === "ALREADY_USED" ? "Code déjà utilisé"
          : d.reason === "EXPIRED" ? "Code expiré"
          : d.reason === "MERCHANT_REQUIRED" ? "Compte marchand requis"
          : "Code invalide";
        setScanResult({ valid: false, code: manualCode, reason });
      }
    } catch (e) {
      setScanResult({ valid: false, code: manualCode, reason: e.message || "Erreur de validation" });
    } finally {
      setValidating(false);
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
        {/* Stats */}
        {show("payout") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ScanLine} label="Scans aujourd'hui" value={scansToday} tone="emerald" />
          <StatCard icon={TrendingUp} label="Ventes du jour" value={fmt(salesToday)} tone="amber" delay={0.05} />
          <StatCard icon={Wallet} label="Solde de paiement" value={fmt(payoutBalance)} tone="blue" delay={0.1} />
          <StatCard icon={Tag} label="Panier moyen" value={fmt(avgRedemption)} tone="rose" delay={0.15} />
        </div>
        )}

        {(show("scan") || show("redemptions")) && (
        <div className={`mt-6 grid gap-4 ${section === "overview" ? "lg:grid-cols-2" : ""}`}>
          {/* Code validation */}
          {show("scan") && (
          <SectionCard title="Validation des codes">
            <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              <div className="text-center px-4">
                <ScanLine className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Saisissez le code de remise présenté par le membre pour le valider instantanément.</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-500">Code de remise :</p>
              <div className="flex gap-2">
                <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="NEL-XXXXXX" className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-emerald-500" />
                <button onClick={validateCode} disabled={validating} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
                </button>
              </div>
              {scanResult && (
                <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-sm ${scanResult.valid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {scanResult.valid ? <Check className="h-4 w-4" /> : <span>✕</span>}
                  {scanResult.valid ? "Code valide — remise appliquée, cashback crédité" : scanResult.reason || "Code invalide ou expiré"}
                </div>
              )}
            </div>
          </SectionCard>
          )}

          {/* Recent redemptions */}
          {show("redemptions") && (
          <SectionCard title="Redemptions récentes">
            {redemptions.length === 0 ? (
              <div className="mt-6"><EmptyState icon={ScanLine} title="Aucune redemption" description="Les codes validés apparaîtront ici en temps réel." /></div>
            ) : (
              <div className="mt-4 space-y-2">
                {redemptions.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900">{s.code_used}</p>
                      <p className="text-xs text-slate-500">{s.redeemed_at ? new Date(s.redeemed_at).toLocaleString() : "En attente"}</p>
                    </div>
                    <div className="text-right">
                      {s.discount_applied > 0 && <p className="text-sm font-semibold text-slate-900">{fmt(s.discount_applied)}</p>}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "REDEEMED" ? "bg-emerald-100 text-emerald-700" : s.status === "EXPIRED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
          )}
        </div>
        )}

        {/* Campaign manager */}
        {show("offers") && (
        <SectionCard className="mt-6" title="Offres & campagnes" action={
          <Link to="/campaign-editor" className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 active:scale-95">
            <Plus className="h-4 w-4" /> Nouvelle campagne
          </Link>
        }>
          {offers.length === 0 ? (
            <div className="mt-6"><EmptyState icon={Tag} title="Aucune campagne" description="Créez votre première offre pour attirer des membres." action={<Link to="/campaign-editor" className="not-pill rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">+ Créer une campagne</Link>} /></div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((c) => {
                const meta = categoryMeta(c.category);
                const reds = (redemptions || []).filter((r) => r.offer_id === c.id).length;
                const active = !c.expires_at || new Date(c.expires_at) >= new Date();
                return (
                  <div key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="relative h-20 bg-slate-100">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><Tag className="h-5 w-5" /></div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700">{meta.emoji} {meta.label}</span>
                      {c.is_featured && <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"><Star className="inline h-2.5 w-2.5" /></span>}
                      <span className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>{active ? "active" : "expirée"}</span>
                    </div>
                    <div className="p-3">
                      <p className="truncate font-medium text-slate-900">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.target_audience === "ALL" ? "B2B + B2C" : c.target_audience}</p>
                      <p className="mt-1 text-sm text-slate-600">{reds} redemption{reds > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
        )}

        {/* Payout */}
        {show("payout") && (
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-emerald-700">Paiement disponible : {fmt(payoutBalance)}</p>
            <p className="text-sm text-emerald-700/80">Transfert vers Mobile Money ou compte bancaire local en instantané.</p>
          </div>
          <button onClick={() => toast({ title: "Paiement demandé", description: `Votre transfert de ${fmt(payoutBalance)} est en cours de traitement.` })} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 active:scale-95">Demander le paiement</button>
        </motion.div>
        )}
        </div>
        </>
        )}
      </MerchantStatusGate>
    </PortalLayout>
  );
}