import Motif from "@/components/brand/Motif";
import BadgeMedal from "@/components/brand/BadgeMedal";
import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import OfferCard from "@/components/OfferCard";
import OfferShelves from "@/components/OfferShelves";
import WithdrawWalletModal from "@/components/WithdrawWalletModal";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useCatalog } from "@/hooks/useCatalog";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { useRewards } from "@/hooks/useRewards";
import { Gift, QrCode, Loader2, Award } from "lucide-react";
import CompanyBanner from "@/components/company/CompanyBanner";
import MemberWelcomeBanner from "@/components/member/MemberWelcomeBanner";
import MemberStories from "@/components/member/MemberStories";
import WalletHero from "@/components/wallet/WalletHero";
import SectionCard from "@/components/dashboard/SectionCard";
import { walletEffect } from "@/pages/WalletActivity";
import { EmptyState, ErrorState } from "@/components/UiFeedback";
import AccessGate from "@/components/AccessGate";

const STATUS = { REDEEMED: "bg-emerald-100 text-emerald-700", EXPIRED: "bg-rose-100 text-rose-700", GENERATED: "bg-amber-100 text-amber-700", INVALID: "bg-slate-100 text-slate-600" };

export default function EmployeePortal() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const money = useCurrencies();
  const [currency, setCurrency] = useDisplayCurrency();
  const { meta } = useCategories();
  const catalog = useCatalog();
  const rewards = useRewards(user);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [params] = useSearchParams();
  const section = params.get("section") || "overview";
  const show = (s) => section === "overview" || section === s;
  const fmt = (usd) => money.format(usd, currency);

  const { data, loading, error: loadError, reload } = useAsync(async () => {
    if (!user?.company_id) return { policies: [], txs: [], redemptions: [] };
    const [policies, txs, redemptions] = await Promise.all([
      entities.BenefitPolicy.filter({ company_id: user.company_id, active: true }, "label"),
      entities.Transaction.filter({ user_id: user.id }, "-created_date", 300),
      entities.Redemption.filter({ user_id: user.id }, "-created_date", 50),
    ]);
    return { policies, txs, redemptions };
  }, [user?.id, user?.company_id], { initial: { policies: [], txs: [], redemptions: [] } });

  // This month: allowance received per category vs. spent at partners of
  // that category (offers paid with the wallet).
  const allowances = useMemo(() => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const month = (data?.txs || []).filter((x) => x.status === "COMPLETED" && new Date(x.created_date) >= start);
    return (data?.policies || []).map((p) => {
      const received = month.filter((x) => x.type === "ALLOCATION" && x.category === p.category).reduce((s, x) => s + Number(x.amount_usd || 0), 0);
      const spent = month.filter((x) => x.type === "REDEMPTION" && x.payment_method === "WALLET" && x.category === p.category).reduce((s, x) => s + Number(x.amount_usd || 0), 0);
      const base = received || Number(p.monthly_amount_usd);
      return { ...p, received, spent, base, pct: base ? Math.min(100, Math.round((spent / base) * 100)) : 0 };
    });
  }, [data]);

  const offers = useMemo(() => catalog.offers.filter((o) => o.target_audience !== "B2C"), [catalog.offers]);
  const offerById = useMemo(() => new Map(catalog.offers.map((o) => [o.id, o])), [catalog.offers]);
  const cashback = (data?.txs || []).filter((x) => x.status === "COMPLETED").reduce((s, x) => s + Number(x.cashback_amount || 0), 0);
  const redeemedCount = (data?.redemptions || []).filter((r) => r.status === "REDEEMED").length;

  return (
    <PortalLayout title={t("portal.employee.title")} theme="light">
      <AccessGate>
      {section === "overview" && <MemberWelcomeBanner />}
      {section === "overview" && <CompanyBanner />}
      {section === "overview" && !catalog.loading && <MemberStories offers={offers} meta={meta} onOpen={setSelectedOffer} />}
      <div className="[&>*:first-child]:mt-0">
      {section === "wallet" && (<>
      <WalletHero
        balance={user?.wallet_balance} fmt={fmt} currency={currency} onCurrency={setCurrency} onWithdraw={() => setWithdrawOpen(true)}
        stats={[
          { label: t("hr.e.cashback"), value: fmt(cashback) },
          { label: t("hr.e.used"), value: String(redeemedCount) },
          { label: t("hr.e.points"), value: String(rewards.points ?? "…") },
        ]}
        recent={(data?.txs || []).filter((x) => x.status === "COMPLETED").slice(0, 4).map((x) => ({ id: x.id, title: x.description || x.type, date: new Date(x.created_date).toLocaleDateString(locale), amount: walletEffect(x) }))}
      />
      <SectionCard title={t("hr.e.allowTitle")} className="mt-4" icon={Gift}>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : loadError ? (
          <ErrorState onRetry={reload} />
        ) : allowances.length === 0 ? (
          <EmptyState icon={Gift} title={t("hr.e.noAllow")} description={t("hr.e.noAllowDesc")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {allowances.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <Motif category={a.category} className="h-10 w-10 shrink-0" />
                  <span className="text-xs text-slate-400">{t("hr.e.pctUsed", { n: a.pct })}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{a.label}</p>
                <p className="text-xl font-bold text-slate-900">{fmt(Math.max(a.base - a.spent, 0))} <span className="text-sm font-normal text-slate-400">/ {fmt(a.base)}</span></p>
                {!a.received && <p className="mt-1 text-xs text-amber-600">{t("hr.e.notYet")}</p>}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-nv-emerald" style={{ width: `${a.pct}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      </>)}

      {section === "badges" && (
      <SectionCard title={t("hr.e.badges")} className="mt-6" icon={Award} action={<Link to="/my-rewards" className="text-sm font-medium text-emerald-600 hover:underline">{t("hr.e.seeAll")}</Link>}>
        {!rewards.ready ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : (
          <div className="flex flex-wrap gap-3">
            {rewards.badges.map((b) => (
              <div key={b.id} title={b.desc} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ${b.earned ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-400"}`}>
                <BadgeMedal glyph={b.glyph} earned={b.earned} className="h-8 w-8" iconClassName="h-4 w-4" />
                <span className="font-medium">{b.name}</span>
                {!b.earned && <span className="text-xs">{b.progress}%</span>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      )}

      {section === "overview" && !catalog.loading && <div className="mt-2"><OfferShelves offers={offers} meta={meta} format={fmt} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} /></div>}
      {section === "offers" && (
      <div className="mt-6">
        {!catalog.loading && <OfferShelves offers={offers} meta={meta} format={fmt} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />}
        <h2 className="mb-4 mt-6 flex items-center gap-2 font-semibold text-slate-900"><QrCode className="h-5 w-5 text-emerald-600" /> {t("offers.title")}</h2>
        {catalog.loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : offers.length === 0 ? (
          <EmptyState icon={QrCode} title={t("hr.e.noOffers")} description={t("hr.e.noOffersDesc")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o, i) => <OfferCard key={o.id} offer={o} meta={meta} format={fmt} index={i} onRedeem={setSelectedOffer} ctaLabel={t("cta.redeem")} />)}
          </div>
        )}
      </div>
      )}

      {section === "history" && (
      <SectionCard title={t("hr.e.recent")} className="mt-6">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : data.redemptions.length === 0 ? (
          <EmptyState icon={QrCode} title={t("hr.e.noCode")} description={t("hr.e.noCodeDesc")} />
        ) : (
          <div className="space-y-2">
            {data.redemptions.map((r) => {
              const o = offerById.get(r.offer_id);
              const st = r.status in STATUS ? r.status : "INVALID";
              const [label, tone] = [t(`hr.e.st.${st}`), STATUS[st]];
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{o?.title || t("hr.e.offer")}</p>
                    <p className="text-xs text-slate-500">{o?.merchant_name || "—"} · {new Date(r.redeemed_at || r.created_date).toLocaleDateString(locale)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-xs ${tone}`}>{label}</span>
                    {Number(r.cashback_credited) > 0 && <p className="mt-1 text-xs text-emerald-600">+{fmt(r.cashback_credited)}</p>}
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
      <WithdrawWalletModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); reload(); }} />
      </AccessGate>
    </PortalLayout>
  );
}
