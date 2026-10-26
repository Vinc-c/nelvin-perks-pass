import React, { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { callRpc } from "@/api/rpc";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import StatCard from "@/components/dashboard/StatCard";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { useI18n } from "@/i18n/I18nContext";
import { Share2, Copy, Check, Users, Gift, UserCheck, MessageCircle } from "lucide-react";

export default function ReferralProgram() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [copied, setCopied] = useState(false);

  const { data, loading } = useAsync(async () => {
    const [referrals, bonus] = await Promise.all([
      callRpc("my_referrals"),
      entities.PlatformSetting.get("referral_bonus_usd").then((s) => Number(s.value)).catch(() => 5),
    ]);
    return { referrals: referrals || [], bonus };
  }, [user?.id], { initial: { referrals: [], bonus: 5 } });

  const code = user?.referral_code || "";
  const link = `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  const referrals = data?.referrals || [];
  const rewarded = referrals.filter((r) => r.rewarded).length;
  const bonusText = money.format(data?.bonus || 0, currency);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const share = async () => {
    const text = t("mb.ref.share", { link });
    if (navigator.share) {
      try { await navigator.share({ title: "Nelvin", text, url: link }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
  };

  return (
    <PortalLayout title={t("mb.ref.title")} theme="light">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("mb.ref.hero", { bonus: bonusText })}</h1>
        <p className="mt-1 max-w-xl text-sm text-emerald-50">
          {t("mb.ref.heroSub", { bonus: bonusText })}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm">
            <span className="truncate font-mono">{link}</span>
          </div>
          <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? t("mb.ref.copied") : t("mb.ref.copy")}
          </button>
          <button onClick={share} className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/30">
            {navigator.share ? <Share2 className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />} {t("mb.ref.shareBtn")}
          </button>
        </div>
        <p className="mt-3 text-xs text-emerald-100">{t("mb.ref.yourCode")}<span className="font-mono font-semibold">{code || "—"}</span></p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label={t("mb.ref.registered")} value={referrals.length} tone="blue" />
        <StatCard icon={UserCheck} label={t("mb.ref.subscribed")} value={rewarded} tone="emerald" delay={0.05} />
        <StatCard icon={Gift} label={t("mb.ref.earned")} value={money.format(rewarded * (data?.bonus || 0), currency)} tone="amber" delay={0.1} />
      </div>

      <SectionCard title={t("mb.ref.listTitle")} className="mt-6">
        {loading ? (
          <ListSkeleton rows={3} />
        ) : referrals.length === 0 ? (
          <EmptyState icon={Users} title={t("mb.ref.emptyTitle")} description={t("mb.ref.emptyDesc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t("mb.ref.colRef")}</th>
                  <th className="pb-3 font-medium">{t("mb.ref.colJoined")}</th>
                  <th className="pb-3 font-medium">{t("mb.ref.colStatus")}</th>
                  <th className="pb-3 font-medium">{t("mb.ref.colBonus")}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-900">{r.display_name}</td>
                    <td className="py-3 text-slate-500">{new Date(r.joined_at).toLocaleDateString(locale)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.onboarded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.onboarded ? t("mb.ref.active") : t("mb.ref.pending")}</span>
                    </td>
                    <td className="py-3">{r.rewarded ? <span className="font-semibold text-emerald-600">+{bonusText}</span> : <span className="text-slate-400">{t("mb.ref.waiting")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PortalLayout>
  );
}
