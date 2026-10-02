import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import RechargeWalletModal from "@/components/RechargeWalletModal";
import WithdrawWalletModal from "@/components/WithdrawWalletModal";
import DealsMap from "@/components/DealsMap";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { mockCurrencies } from "@/data/mockData";
import { Wallet, ArrowDownLeft, ArrowUpRight, MapPin, Crown, Star, TrendingUp, Loader2 } from "lucide-react";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";

export default function MemberPortal() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [currency, setCurrency] = useState(user?.wallet_currency || "USD");
  const [filter, setFilter] = useState("ALL");
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshActivity = async () => {
    if (!user) return;
    try {
      const [tx, red] = await Promise.all([
        base44.entities.Transaction.filter({ created_by_id: user.id }, "-created_date", 50),
        base44.entities.Redemption.filter({ created_by_id: user.id }, "-created_date", 50),
      ]);
      setTransactions(tx || []);
      setRedemptions(red || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [off, mer, tx, red] = await Promise.all([
          base44.entities.Offer.list("-created_date", 100),
          base44.entities.Merchant.list("-created_date", 200),
          user ? base44.entities.Transaction.filter({ created_by_id: user.id }, "-created_date", 50) : Promise.resolve([]),
          user ? base44.entities.Redemption.filter({ created_by_id: user.id }, "-created_date", 50) : Promise.resolve([]),
        ]);
        if (!alive) return;
        setOffers(off || []);
        setMerchants(mer || []);
        setTransactions(tx || []);
        setRedemptions(red || []);
      } catch {
        if (alive) {
          setOffers([]); setMerchants([]); setTransactions([]); setRedemptions([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  const merchantById = useMemo(() => {
    const m = {};
    (merchants || []).forEach((x) => { m[x.id] = x; });
    return m;
  }, [merchants]);

  const cur = mockCurrencies.find((c) => c.code === currency) || mockCurrencies[0];
  const convert = (v) => (Number(v || 0) * (cur?.rate || 1));

  // Real wallet balance from the user's stored wallet, cashback from transactions,
  // deals redeemed from redemption history.
  const balance = user?.wallet_balance ?? 0;
  const cashback = (transactions || []).reduce((s, x) => s + (x.cashback_amount || 0), 0);
  const redeemedCount = (redemptions || []).filter((r) => r.status === "REDEEMED").length;
  const tier = user?.account_type === "entreprise" ? "Business" : "VIP Gold";

  const visibleOffers = (offers || []).filter((o) =>
    filter === "ALL" ? true : o.target_audience === filter || o.target_audience === "ALL"
  );

  const decorate = (o) => {
    const m = merchantById[o.merchant_id] || {};
    return { ...o, merchant_name: m.name || t("wallet.merchant") || "Merchant", city: m.city || "", category: m.category || o.category || "" };
  };

  const mapMerchants = (merchants || []).filter((m) => m.verified_status === "VERIFIED" && m.lat && m.lng);

  return (
    <PortalLayout title={t("portal.member.title")} theme="light">
      <AccessGate>
      <RoleWelcomeHeader />
      <div className="[&>*:first-child]:mt-0">
      {show("wallet") && (<>
      {/* Wallet card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-emerald-50"><Wallet className="h-4 w-4" /> {t("wallet.title")}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg bg-white/15 px-2 py-1 text-xs text-white outline-none">
              {mockCurrencies.map((c) => <option key={c.code} value={c.code} className="bg-white text-slate-900">{c.code}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-emerald-50"><Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading") || "Loading…"}</div>
          ) : (
            <>
              <p className="mt-4 text-4xl font-bold text-white">{cur.symbol}{convert(balance).toFixed(2)}</p>
              <p className="mt-1 text-sm text-emerald-50">{t("wallet.balance")}</p>
            </>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setRechargeOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30 active:scale-95">
              <ArrowDownLeft className="h-4 w-4" /> {t("wallet.recharge")}
            </button>
            <button onClick={() => setWithdrawOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30 active:scale-95">
              <ArrowUpRight className="h-4 w-4" /> {t("wallet.withdraw")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label={t("wallet.cashback")} value={`${cur.symbol}${convert(cashback).toFixed(2)}`} tone="emerald" />
        <StatCard icon={Crown} label="Niveau actuel" value={tier} tone="amber" delay={0.05} />
        <StatCard icon={Star} label="Offres échangées" value={redeemedCount} tone="emerald" delay={0.1} />
      </div>
      </>)}

      {show("offers") && (<>
      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["ALL", "B2C", "B2B_ONLY"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {f === "ALL" ? "Toutes les offres" : f === "B2C" ? "Particulier" : "Employé seulement"}
          </button>
        ))}
      </div>

      {/* Offers grid */}
      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : visibleOffers.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={Star} title="Aucune offre pour le moment" description="Revenez bientôt — de nouveaux avantages sont ajoutés chaque semaine." />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleOffers.map((offer, i) => {
            const o = decorate(offer);
            return (
              <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-28 bg-gradient-to-br from-emerald-100 to-blue-100">
                  {o.is_featured && <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">⭐ À la une</span>}
                  <span className="absolute right-3 top-3 rounded-lg bg-white/80 px-2 py-1 text-xs text-slate-700">{o.category?.replace(/_/g, " ")}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{o.title}</h3>
                  <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3 w-3" /> {o.merchant_name}{o.city ? ` · ${o.city}` : ""}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">{o.discount_type === "BOGO" ? "2-for-1" : o.discount_type === "FIXED" ? `$${o.discount_value} off` : `${o.discount_value}% off`}</span>
                    <span className="text-xs text-amber-600">{o.cashback_rate}% cashback</span>
                  </div>
                  <button onClick={() => setSelectedOffer(o)} className="mt-3 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
                    {t("cta.redeem")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </>)}

      {/* Interactive geolocation map */}
      {section === "overview" && mapMerchants.length > 0 && (
        <div className="mt-6">
          <DealsMap merchants={mapMerchants} onSelect={(m) => setSelectedOffer(decorate((offers || []).find((o) => o.merchant_id === m.id) || { merchant_id: m.id, merchant_name: m.name, city: m.city }))} />
        </div>
      )}

      {/* Transactions */}
      {show("activity") && (
      <SectionCard title="Transactions récentes" className="mt-6">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune transaction" description="Échangez votre première offre pour voir votre activité ici." />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const m = merchantById[tx.merchant_id] || {};
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tx.type === "RECHARGE" ? "bg-emerald-100" : tx.type === "WITHDRAWAL" ? "bg-rose-100" : "bg-slate-100"}`}>
                      {tx.type === "RECHARGE" ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : tx.type === "WITHDRAWAL" ? <ArrowUpRight className="h-4 w-4 text-rose-600" /> : <Wallet className="h-4 w-4 text-slate-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.name || tx.type}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.created_date || tx.updated_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === "WITHDRAWAL" ? "text-rose-600" : "text-slate-900"}`}>
                      {tx.type === "WITHDRAWAL" ? "-" : tx.type === "RECHARGE" ? "+" : ""}{cur.symbol}{convert(tx.amount).toFixed(2)}
                    </p>
                    {tx.cashback_amount > 0 && <p className="text-xs text-emerald-600">+{cur.symbol}{convert(tx.cashback_amount).toFixed(2)} cashback</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      )}
      </div>

      <AnimatePresence>
        {selectedOffer && <QrRedemption offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}
      </AnimatePresence>

      <RechargeWalletModal open={rechargeOpen} onClose={() => { setRechargeOpen(false); refreshActivity(); }} currency={currency} country={user?.country || ""} />

      <WithdrawWalletModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); refreshActivity(); }} currency={currency} country={user?.country || ""} balance={convert(balance)} />
      </AccessGate>
    </PortalLayout>
  );
}