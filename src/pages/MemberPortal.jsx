import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import RechargeWalletModal from "@/components/RechargeWalletModal";
import WithdrawWalletModal from "@/components/WithdrawWalletModal";
import PartnerMap from "@/components/map/PartnerMap";
import OfferCard from "@/components/OfferCard";
import CurrencySelect from "@/components/CurrencySelect";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useCatalog } from "@/hooks/useCatalog";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { usePlans } from "@/hooks/usePlans";
import { TX_LABELS, walletEffect } from "@/pages/WalletActivity";
import { ArrowDownLeft, ArrowUpRight, Crown, Loader2, Search, Star, TrendingUp, Wallet } from "lucide-react";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";
import NvIcon, { CategoryIcon } from "@/components/brand/NvIcon";
import NelvinPassCard from "@/components/brand/NelvinPassCard";
import SavingsPanel from "@/components/dashboard/SavingsPanel";

export default function MemberPortal() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const { byCode } = usePlans();
  const { meta, categories } = useCategories();
  const catalog = useCatalog();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;

  const { data: activity, loading, reload } = useAsync(async () => {
    if (!user) return { txs: [], subs: [], redeemed: 0 };
    const [txs, subs, redeemed] = await Promise.all([
      entities.Transaction.filter({ user_id: user.id }, "-created_date", 50),
      entities.Subscription.filter({ user_id: user.id, company_id: null, merchant_id: null }, "-created_date", 10),
      entities.Redemption.filter({ user_id: user.id, status: "REDEEMED" }, "-redeemed_at", 500),
    ]);
    return { txs, subs, redeemed: redeemed.length };
  }, [user?.id], { initial: { txs: [], subs: [], redeemed: 0 } });

  const activeSub = (activity?.subs || []).find((s) => s.status === "ACTIVE" && (!s.expires_at || new Date(s.expires_at) > new Date()));
  const planName = activeSub ? byCode(activeSub.plan_type)?.name || activeSub.plan_type : "Accès gratuit";
  const memberCode = user?.id ? `NLV · ${String(user.id).replace(/-/g, "").slice(0, 4).toUpperCase()} ${String(user.id).replace(/-/g, "").slice(4, 8).toUpperCase()}` : "";
  const cashback = (activity?.txs || []).filter((x) => x.status === "COMPLETED").reduce((s, x) => s + Number(x.cashback_amount || 0), 0);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const doneTx = (activity?.txs || []).filter((x) => x.status === "COMPLETED");
  const savedOf = (x) => Number(x.savings_usd || 0) + Number(x.cashback_amount || 0);
  const totalSaved = doneTx.reduce((s, x) => s + savedOf(x), 0);
  const monthSaved = doneTx.filter((x) => new Date(x.created_date) >= monthStart).reduce((s, x) => s + savedOf(x), 0);
  const currentPlan = activeSub ? byCode(activeSub.plan_type) : null;
  const passCost = Number(currentPlan?.price_monthly || 0);
  const nextPlan = ["PASS_BASIC", "PASS_PREMIUM", "PASS_VIP"].map((c) => byCode(c)).filter(Boolean).find((p) => Number(p.price_monthly) > passCost) || null;

  const offers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.offers
      .filter((o) => o.target_audience !== "B2B_ONLY" || user?.company_id)
      .filter((o) => category === "ALL" || o.category === category)
      .filter((o) => !q || o.title.toLowerCase().includes(q) || o.merchant_name.toLowerCase().includes(q) || (o.city || "").toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
  }, [catalog.offers, category, query, user?.company_id]);

  const usedCategories = ["ALL", ...categories.map((c) => c.value).filter((v) => catalog.offers.some((o) => o.category === v))];
  const fmt = (usd) => money.format(usd, currency);

  return (
    <PortalLayout title={t("portal.member.title")} theme="light">
      <AccessGate>
      <RoleWelcomeHeader />
      <div className="[&>*:first-child]:mt-0">
      {show("wallet") && (<>
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <NelvinPassCard tier={activeSub?.plan_type || "PASS_FREE"} name={(user?.full_name || "").toUpperCase()} code={memberCode} showQr={false} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-lg">
          <NvIcon name="AFRICA" tone="dark" strokeWidth={0.5} className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 text-nv-gold" faint={0.15} />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-emerald-50"><NvIcon name="WALLET" tone="dark" className="h-5 w-5" /> {t("wallet.title")}</span>
              <CurrencySelect value={currency} onChange={setCurrency} tone="dark" />
            </div>
            <p className="mt-4 text-4xl font-bold text-white">{fmt(user?.wallet_balance)}</p>
            <p className="mt-1 text-sm text-emerald-50">{t("wallet.balance")}</p>
          </div>
          <div className="relative mt-4 flex gap-2">
            <button onClick={() => setRechargeOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30 active:scale-95">
              <ArrowDownLeft className="h-4 w-4" /> {t("wallet.recharge")}
            </button>
            <button onClick={() => setWithdrawOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30 active:scale-95">
              <ArrowUpRight className="h-4 w-4" /> {t("wallet.withdraw")}
            </button>
          </div>
        </motion.div>
      </div>

      <SavingsPanel total={totalSaved} month={monthSaved} passCost={passCost} next={passCost > 0 ? nextPlan : null} fmt={fmt} />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label={t("wallet.cashback")} value={fmt(cashback)} tone="emerald" />
        <Link to="/billing-settings" className="block"><StatCard icon={Crown} label="Mon Pass" value={planName} tone="amber" delay={0.05} hint={activeSub ? `Jusqu'au ${new Date(activeSub.expires_at).toLocaleDateString("fr-FR")}` : "Découvrir les Pass"} /></Link>
        <StatCard icon={Star} label="Offres utilisées" value={activity?.redeemed || 0} tone="emerald" delay={0.1} />
      </div>
      </>)}

      {show("offers") && (<>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {usedCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-nv-deep text-white shadow" : "border border-nv-line bg-white text-slate-600 hover:bg-nv-ivory"}`}>
              {c === "ALL" ? <NvIcon name="AFRICA" tone={category === c ? "dark" : "light"} className="h-4 w-4" /> : <CategoryIcon category={c} tone={category === c ? "dark" : "light"} className="h-4 w-4" />}
              {c === "ALL" ? "Toutes les offres" : meta(c).label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Offre, partenaire, ville" aria-label="Rechercher une offre" className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
      </div>

      {catalog.loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : offers.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Star} title="Aucune offre pour le moment" description="De nouveaux partenaires rejoignent Nelvin chaque semaine." /></div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o, i) => <OfferCard key={o.id} offer={o} meta={meta} format={fmt} index={i} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />)}
        </div>
      )}
      </>)}

      {section === "overview" && catalog.merchants.some((m) => m.lat != null) && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold text-slate-900">Partenaires sur la carte</h2>
            <Link to="/merchant-map" className="text-sm font-medium text-emerald-600 hover:underline">Ouvrir la carte</Link>
          </div>
          <div className="h-72">
            <PartnerMap merchants={catalog.merchants} onSelect={(m) => navigate(`/merchant-map?m=${m.id}`)} />
          </div>
        </div>
      )}

      {show("activity") && (
      <SectionCard title="Transactions récentes" className="mt-6" action={<Link to="/wallet-activity" className="text-sm font-medium text-emerald-600 hover:underline">Tout voir</Link>}>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : activity.txs.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune transaction" description="Utilisez votre première offre pour voir votre activité ici." />
        ) : (
          <div className="space-y-2">
            {activity.txs.slice(0, 8).map((tx) => {
              const effect = walletEffect(tx);
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.description || TX_LABELS[tx.type]}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_date).toLocaleDateString("fr-FR")} · {TX_LABELS[tx.type]}{tx.status === "PENDING" ? " · en attente" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${effect > 0 ? "text-emerald-600" : effect < 0 ? "text-rose-600" : "text-slate-900"}`}>{effect > 0 ? "+" : effect < 0 ? "-" : ""}{fmt(Math.abs(effect) || tx.amount_usd || tx.amount)}</p>
                    {Number(tx.savings_usd) > 0 && <p className="text-xs text-amber-600">{fmt(tx.savings_usd)} économisés</p>}
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
        {selectedOffer && <QrRedemption offer={selectedOffer} onClose={() => { setSelectedOffer(null); reload(); }} />}
      </AnimatePresence>
      <RechargeWalletModal open={rechargeOpen} onClose={() => { setRechargeOpen(false); reload(); }} />
      <WithdrawWalletModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); reload(); }} />
      </AccessGate>
    </PortalLayout>
  );
}
