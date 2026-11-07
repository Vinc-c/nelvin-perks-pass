import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import RechargeWalletModal from "@/components/RechargeWalletModal";
import WithdrawWalletModal from "@/components/WithdrawWalletModal";
import PartnerMap from "@/components/map/PartnerMap";
import OfferCard from "@/components/OfferCard";
import OfferShelves from "@/components/OfferShelves";
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
import { walletEffect } from "@/pages/WalletActivity";
import { txTitle, txChip } from "@/lib/txDisplay";
import { ChevronRight, Crown, Plus, ArrowUpRight, Loader2, Search, Star, TrendingUp, Wallet } from "lucide-react";
import MemberStories from "@/components/member/MemberStories";
import MemberPromo from "@/components/member/MemberPromo";
import MemberWelcomeBanner, { displayName } from "@/components/member/MemberWelcomeBanner";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState, ErrorState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";
import NvIcon, { CategoryIcon } from "@/components/brand/NvIcon";
import NelvinPassCard, { CARD_COLORS } from "@/components/brand/NelvinPassCard";
import SavingsPanel from "@/components/dashboard/SavingsPanel";

export default function MemberPortal() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
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
  const homeOffers = useMemo(() => catalog.offers.filter((o) => o.target_audience !== "B2B_ONLY" || user?.company_id), [catalog.offers, user?.company_id]);

  const { data: activity, loading, error: loadError, reload } = useAsync(async () => {
    if (!user) return { txs: [], subs: [], redeemed: 0 };
    const [txs, subs, redeemed] = await Promise.all([
      entities.Transaction.filter({ user_id: user.id }, "-created_date", 50),
      entities.Subscription.filter({ user_id: user.id, company_id: null, merchant_id: null }, "-created_date", 10),
      entities.Redemption.filter({ user_id: user.id, status: "REDEEMED" }, "-redeemed_at", 500),
    ]);
    return { txs, subs, redeemed: redeemed.length };
  }, [user?.id], { initial: { txs: [], subs: [], redeemed: 0 } });

  const activeSub = (activity?.subs || []).find((s) => s.status === "ACTIVE" && (!s.expires_at || new Date(s.expires_at) > new Date()));
  // Cardholder: full name, else the part of the email before @ (same as the welcome banner).
  const holderName = displayName(user);
  const colorKey = `nelvin_card_color_${user?.id || ""}`;
  const [cardColor, setCardColor] = useState(() => { try { const v = localStorage.getItem(colorKey); return CARD_COLORS[v] ? v : null; } catch { return null; } });
  const pickCardColor = (key) => {
    setCardColor(key);
    try { key ? localStorage.setItem(colorKey, key) : localStorage.removeItem(colorKey); } catch { /* storage unavailable */ }
  };
  const planName = activeSub ? byCode(activeSub.plan_type)?.name || activeSub.plan_type : t("mb.portal.freeAccess");
  const idHex = String(user?.id || "").replace(/-/g, "").toUpperCase();
  const memberCode = idHex ? `NLV ${idHex.slice(0, 4)} ${idHex.slice(4, 8)}` : "";
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

  // Nearby partners: the city with the most mapped partners, so the map opens zoomed in on one place.
  const nearbyMerchants = useMemo(() => {
    const mapped = catalog.merchants.filter((m) => m.lat != null && m.lng != null);
    const counts = {};
    mapped.forEach((m) => { const c = (m.city || "").trim().toLowerCase().split(/\s+/)[0]; counts[c] = (counts[c] || 0) + 1; });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const local = mapped.filter((m) => (m.city || "").trim().toLowerCase().split(/\s+/)[0] === top);
    return local.length ? local : mapped;
  }, [catalog.merchants]);
  const planByCode = (c) => byCode(c)?.name;
  // One clean list: failed attempts are hidden and a pending row is dropped when a newer one for the same purchase exists.
  const recentTxs = useMemo(() => {
    const seen = new Set();
    return (activity?.txs || []).filter((x) => x.status !== "FAILED" && x.status !== "CANCELLED").filter((x) => {
      if (x.status !== "PENDING") return true;
      const k = `${x.type}|${x.description}|${x.amount}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [activity?.txs]);
  const usedCategories = ["ALL", ...categories.map((c) => c.value).filter((v) => catalog.offers.some((o) => o.category === v))];
  const fmt = (usd) => money.format(usd, currency);

  return (
    <PortalLayout title={t("portal.member.title")} theme="light">
      <AccessGate>
      {section === "overview" && <MemberWelcomeBanner />}
      {section === "overview" && !catalog.loading && <MemberStories offers={homeOffers} meta={meta} onOpen={setSelectedOffer} />}
      <div className="[&>*:first-child]:mt-0">
      {section === "wallet" && (<>
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <NelvinPassCard tier={activeSub?.plan_type || "PASS_FREE"} name={holderName} code={memberCode} showQr={false} color={cardColor} variant="member" />
          <div className="mt-3 flex items-center gap-3" role="radiogroup" aria-label={t("pass.color.label")}>
            <span className="text-xs text-slate-500">{t("pass.color.label")}</span>
            {Object.entries(CARD_COLORS).map(([key, c]) => (
              <button key={key} type="button" role="radio" aria-checked={(cardColor || "burgundy") === key} aria-label={t(`pass.color.${key}`)} title={t(`pass.color.${key}`)}
                onClick={() => pickCardColor(key === "burgundy" ? null : key)}
                className={`h-6 w-6 rounded-full border-2 transition ${(cardColor || "burgundy") === key ? "border-white ring-2 ring-nv-gold" : "border-white ring-1 ring-slate-200"}`} style={{ background: c.swatch }} />
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col justify-between rounded-[20px] border border-slate-200 bg-white p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t("rd.walletBalance")}</span>
              <CurrencySelect value={currency} onChange={setCurrency} tone="light" />
            </div>
            <p className="mt-3 text-[40px] font-medium leading-none text-slate-900">{fmt(user?.wallet_balance)}</p>
            <p className="mt-2 text-sm text-slate-500">{t("rd.available")}</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => setRechargeOpen(true)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-nv-emerald text-sm font-medium text-white transition hover:bg-nv-deep active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={1.5} /> {t("wallet.recharge")}
            </button>
            <button onClick={() => setWithdrawOpen(true)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 transition hover:bg-slate-50 active:scale-95">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} /> {t("wallet.withdraw")}
            </button>
          </div>
        </motion.div>
      </div>

      <SavingsPanel total={totalSaved} month={monthSaved} passCost={passCost} next={passCost > 0 ? nextPlan : null} fmt={fmt} />

      <div className="mt-3 divide-y divide-slate-100 rounded-[20px] border border-slate-200 bg-white">
        {[
          { icon: TrendingUp, label: t("rd.cashbackEarned"), value: fmt(cashback) },
          { icon: Crown, label: t("rd.yourPlan"), value: planName, to: "/billing-settings" },
          { icon: Star, label: t("rd.offersUsed"), value: String(activity?.redeemed || 0) },
        ].map((r) => {
          const Icon = r.icon;
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-nv-emerald/10 text-nv-emerald"><Icon className="h-[18px] w-[18px]" strokeWidth={1.5} /></span>
              <span className="flex-1 text-sm text-slate-600">{r.label}</span>
              <span className="text-sm font-medium text-slate-900">{r.value}</span>
              {r.to && <ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180" strokeWidth={1.5} />}
            </>
          );
          return r.to
            ? <Link key={r.label} to={r.to} className="flex items-center gap-3 px-4 py-3">{body}</Link>
            : <div key={r.label} className="flex items-center gap-3 px-4 py-3">{body}</div>;
        })}
      </div>
      </>)}

      {section === "overview" && !catalog.loading && <OfferShelves offers={homeOffers} meta={meta} format={fmt} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />}
      {section === "overview" && <MemberPromo />}

      {section === "offers" && (<>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {usedCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-nv-deep text-white shadow" : "border border-nv-line bg-white text-slate-600 hover:bg-nv-ivory"}`}>
              {c === "ALL" ? <NvIcon name="AFRICA" tone={category === c ? "dark" : "light"} className="h-4 w-4" /> : <CategoryIcon category={c} tone={category === c ? "dark" : "light"} className="h-4 w-4" />}
              {c === "ALL" ? t("mb.portal.allOffers") : meta(c).label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("mb.portal.searchPlaceholder")} aria-label={t("mb.portal.searchAria")} className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
      </div>

      {!catalog.loading && category === "ALL" && !query.trim() && (
        <OfferShelves offers={catalog.offers.filter((o) => o.target_audience !== "B2B_ONLY" || user?.company_id)} meta={meta} format={fmt} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />
      )}

      {catalog.loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : offers.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Star} title={t("mb.portal.noOffers")} description={t("mb.portal.noOffersDesc")} /></div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o, i) => <OfferCard key={o.id} offer={o} meta={meta} format={fmt} index={i} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />)}
        </div>
      )}
      </>)}

      {section === "overview" && catalog.merchants.some((m) => m.lat != null) && (
        <div className="mt-6 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-medium text-slate-900">{t("rd.nearby")}</h2>
            <Link to="/merchant-map" className="text-sm font-medium text-emerald-600 hover:underline">{t("mb.portal.openMap")}</Link>
          </div>
          <div className="h-56">
            <PartnerMap merchants={nearbyMerchants} onSelect={(m) => navigate(`/merchant-map?m=${m.id}`)} />
          </div>
        </div>
      )}

      {section === "activity" && (
      <SectionCard title={t("mb.portal.recentTx")} className="mt-6" action={<Link to="/wallet-activity?view=tx" className="text-sm font-medium text-emerald-600 hover:underline">{t("mb.portal.seeAll")}</Link>}>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : loadError ? (
          <ErrorState onRetry={reload} />
        ) : activity.txs.length === 0 ? (
          <EmptyState icon={Wallet} title={t("mb.portal.noTx")} description={t("mb.portal.noTxDesc")} />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTxs.map((tx) => {
              const effect = walletEffect(tx);
              const chip = txChip(tx, t);
              return (
                <div key={tx.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{txTitle(tx, t, planByCode)}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {new Date(tx.created_date).toLocaleDateString(locale)}
                      {chip && <span className={`rounded-full px-2 py-0.5 text-[11px] ${chip.cls}`}>{chip.label}</span>}
                    </p>
                  </div>
                  <p className={`shrink-0 text-sm font-medium ${effect > 0 ? "text-emerald-600" : "text-slate-900"}`}>{effect > 0 ? "+" : effect < 0 ? "−" : ""}{fmt(Math.abs(effect) || tx.amount_usd || tx.amount)}</p>
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
