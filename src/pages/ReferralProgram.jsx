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
import { Share2, Copy, Check, Users, Gift, UserCheck, MessageCircle } from "lucide-react";

export default function ReferralProgram() {
  const { user } = useAuth();
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
    const text = `Rejoins Nelvin et profite d'offres et de cashback partout en Afrique : ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Nelvin", text, url: link }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
  };

  return (
    <PortalLayout title="Parrainage" theme="light">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Parrainez, gagnez {bonusText}</h1>
        <p className="mt-1 max-w-xl text-sm text-emerald-50">
          Partagez votre lien. Dès que votre filleul souscrit son premier Pass, {bonusText} sont crédités sur votre wallet.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm">
            <span className="truncate font-mono">{link}</span>
          </div>
          <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
          </button>
          <button onClick={share} className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/30">
            {navigator.share ? <Share2 className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />} Partager
          </button>
        </div>
        <p className="mt-3 text-xs text-emerald-100">Votre code : <span className="font-mono font-semibold">{code || "—"}</span></p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Filleuls inscrits" value={referrals.length} tone="blue" />
        <StatCard icon={UserCheck} label="Filleuls abonnés" value={rewarded} tone="emerald" delay={0.05} />
        <StatCard icon={Gift} label="Bonus gagnés" value={money.format(rewarded * (data?.bonus || 0), currency)} tone="amber" delay={0.1} />
      </div>

      <SectionCard title="Vos filleuls" className="mt-6">
        {loading ? (
          <ListSkeleton rows={3} />
        ) : referrals.length === 0 ? (
          <EmptyState icon={Users} title="Aucun filleul pour l'instant" description="Partagez votre lien : vos filleuls apparaîtront ici dès leur inscription." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-medium">Filleul</th>
                  <th className="pb-3 font-medium">Inscription</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-900">{r.display_name}</td>
                    <td className="py-3 text-slate-500">{new Date(r.joined_at).toLocaleDateString("fr-FR")}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${r.onboarded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{r.onboarded ? "Actif" : "Inscription en cours"}</span>
                    </td>
                    <td className="py-3">{r.rewarded ? <span className="font-semibold text-emerald-600">+{bonusText}</span> : <span className="text-slate-400">En attente du 1er abonnement</span>}</td>
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
