import { useMemo } from "react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";

// Points and badges are derived from real, auditable activity — nothing is
// stored separately, so they can never drift from the ledger.
export const POINTS = { redemption: 10, perUsdSaved: 1, recognitionReceived: 10, referral: 50 };

export const TIERS = [
  { id: "BRONZE", label: "Bronze", min: 0 },
  { id: "SILVER", label: "Argent", min: 250 },
  { id: "GOLD", label: "Or", min: 750 },
  { id: "PLATINUM", label: "Platine", min: 2000 },
];

const WELLNESS = new Set(["WELLNESS_MENTAL", "FITNESS_SPORTS", "HEALTHCARE", "BEAUTY_CARE"]);

export const BADGES = [
  { id: "FIRST", name: "Premier pas", desc: "Utiliser une première offre", glyph: "SPARK", target: 1, metric: "redemptions" },
  { id: "FOODIE", name: "Gourmet", desc: "5 offres restauration", glyph: "FOOD_DINING", target: 5, metric: "food" },
  { id: "WELLNESS", name: "Bien-être", desc: "3 offres sport, santé ou beauté", glyph: "WELLNESS_MENTAL", target: 3, metric: "wellness" },
  { id: "EXPLORER", name: "Explorateur", desc: "Utiliser des offres chez 5 partenaires", glyph: "CITY_PIN", target: 5, metric: "merchants" },
  { id: "GLOBE", name: "Globe-trotter", desc: "Utiliser des offres dans 3 pays", glyph: "AFRICA", target: 3, metric: "countries" },
  { id: "SAVER100", name: "Économe", desc: "100 $ économisés (remises + cashback)", glyph: "FINANCIAL_WELLNESS", target: 100, metric: "saved" },
  { id: "SAVER500", name: "Top saver", desc: "500 $ économisés", glyph: "PASS_VIP", target: 500, metric: "saved" },
  { id: "TEAM", name: "Esprit d'équipe", desc: "Reconnaître 5 collègues", glyph: "FAMILY_PARENTING", target: 5, metric: "sent", company: true },
  { id: "STAR", name: "Collègue étoile", desc: "Être reconnu 5 fois", glyph: "STAR_MARK", target: 5, metric: "received", company: true },
  { id: "AMBASSADOR", name: "Ambassadeur", desc: "3 filleuls inscrits", glyph: "WHATSAPP", target: 3, metric: "referrals" },
];

export function useRewards(user) {
  const { data, loading, reload } = useAsync(async () => {
    if (!user) return null;
    const [redemptions, txs, received, sent, referrals, catalog] = await Promise.all([
      entities.Redemption.filter({ user_id: user.id, status: "REDEEMED" }, "-redeemed_at", 500),
      entities.Transaction.filter({ user_id: user.id, status: "COMPLETED" }, "-created_date", 500),
      user.company_id ? entities.Recognition.filter({ to_user_id: user.id }, "-created_date", 200) : [],
      user.company_id ? entities.Recognition.filter({ from_user_id: user.id }, "-created_date", 200) : [],
      callRpc("my_referrals").catch(() => []),
      entities.Merchant.list("name", 500).catch(() => []),
    ]);
    return { redemptions, txs, received, sent, referrals: referrals || [], merchants: catalog };
  }, [user?.id, user?.company_id]);

  const computed = useMemo(() => {
    if (!data) return null;
    const merchantById = new Map(data.merchants.map((m) => [m.id, m]));
    const redemptionTx = data.txs.filter((t) => t.type === "REDEMPTION");
    const saved = redemptionTx.reduce((s, t) => s + Number(t.savings_usd || 0) + Number(t.cashback_amount || 0), 0);
    const cashback = redemptionTx.reduce((s, t) => s + Number(t.cashback_amount || 0), 0);
    const merchants = new Set(data.redemptions.map((r) => r.merchant_id).filter(Boolean));
    const countries = new Set([...merchants].map((id) => merchantById.get(id)?.country).filter(Boolean));
    const byCategory = (pred) => redemptionTx.filter((t) => pred(t.category)).length;
    const metrics = {
      redemptions: data.redemptions.length,
      food: byCategory((c) => c === "FOOD_DINING"),
      wellness: byCategory((c) => WELLNESS.has(c)),
      merchants: merchants.size,
      countries: countries.size,
      saved,
      sent: data.sent.length,
      received: data.received.length,
      referrals: data.referrals.filter((r) => r.onboarded).length,
    };
    const recognitionPoints = data.received.reduce((s, r) => s + Number(r.points || POINTS.recognitionReceived), 0);
    const points = Math.round(
      metrics.redemptions * POINTS.redemption +
      saved * POINTS.perUsdSaved +
      recognitionPoints +
      data.referrals.filter((r) => r.rewarded).length * POINTS.referral
    );
    const tier = [...TIERS].reverse().find((t) => points >= t.min) || TIERS[0];
    const nextTier = TIERS.find((t) => t.min > points) || null;

    const badges = BADGES.filter((b) => !b.company || user?.company_id).map((b) => {
      const value = metrics[b.metric] || 0;
      return { ...b, value, earned: value >= b.target, progress: Math.min(100, Math.round((value / b.target) * 100)) };
    });

    // Reward timeline: cashback, allocations, bonuses, recognitions.
    const timeline = [
      ...data.txs
        .filter((t) => Number(t.cashback_amount) > 0 || ["ALLOCATION", "REFERRAL_BONUS"].includes(t.type))
        .map((t) => ({
          id: `tx-${t.id}`,
          date: t.created_date,
          kind: t.type === "REDEMPTION" ? "CASHBACK" : t.type,
          title: t.type === "REDEMPTION" ? `Cashback — ${t.description || "offre partenaire"}` : t.description || t.type,
          usd: t.type === "REDEMPTION" ? Number(t.cashback_amount) : Number(t.amount_usd || t.amount),
        })),
      ...data.received.map((r) => ({
        id: `rec-${r.id}`,
        date: r.created_date,
        kind: "RECOGNITION",
        title: r.message,
        points: r.points,
        badge: r.badge,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return { metrics, points, tier, nextTier, badges, timeline, cashback, saved, recognitionPoints, received: data.received };
  }, [data, user?.company_id]);

  return { ...(computed || {}), loading, reload, ready: !!computed };
}
