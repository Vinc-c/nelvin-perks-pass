import { useEffect, useMemo, useState } from "react";
import { entities } from "@/api/entities";
import { useI18n } from "@/i18n/I18nContext";

// Pricing lives in the `plans` table (Admin → Plans & tarifs). These defaults
// mirror the seeded rows and only cover the first paint.
export const DEFAULT_PLANS = [
  { code: "PASS_BASIC", audience: "B2C", name: "Pass Basic", tagline: "Commencez à économiser au quotidien", price_monthly: 9, price_annual: 91, features: ["Accès aux offres partenaires", "Cashback sur chaque échange", "Wallet multi-devises", "Support par email"], popular: false, sort_order: 1 },
  { code: "PASS_PREMIUM", audience: "B2C", family_seats: 2, name: "Pass Premium", tagline: "Le plus choisi par nos membres", price_monthly: 19, price_annual: 193, features: ["Tout le Pass Basic", "Privilèges exclusifs (extras offerts, surclassements)", "Retraits Mobile Money", "Offres prioritaires", "Support prioritaire"], popular: true, sort_order: 2 },
  { code: "PASS_VIP", audience: "B2C", family_seats: 4, name: "Pass VIP Gold", tagline: "Avantages luxe et conciergerie", price_monthly: 39, price_annual: 397, features: ["Tout le Pass Premium", "Hôtels & expériences luxe", "Conciergerie dédiée", "Événements VIP"], popular: false, sort_order: 3 },
  { code: "STARTER", audience: "B2B", name: "Starter Team", tagline: "Jusqu'à 15 employés", price_monthly: 79, price_annual: 805, max_employees: 15, features: ["15 sièges employés", "Invitations par code", "Wallet entreprise & allocations", "Validation QR", "Support email"], popular: false, sort_order: 10 },
  { code: "GROWTH", audience: "B2B", name: "Growth Business", tagline: "Jusqu'à 59 employés", price_monthly: 129, price_annual: 1315, max_employees: 59, features: ["59 sièges employés", "Politique d'avantages flexibles", "Rapports & analytics RH", "Mur de reconnaissance", "Support prioritaire"], popular: true, sort_order: 11 },
  { code: "ENTERPRISE", audience: "B2B", name: "Enterprise Unlimited", tagline: "Employés illimités", price_monthly: 189, price_annual: 1927, max_employees: null, features: ["Sièges illimités", "Tout le plan Growth", "Account manager dédié", "SLA personnalisé"], popular: false, sort_order: 12 },
  { code: "MERCHANT_BASIC", audience: "MERCHANT", name: "Merchant Basic", tagline: "Visibilité et validation des codes", price_monthly: 29, price_annual: 295, features: ["Fiche marchand", "Validation des codes", "Campagnes standard", "Paiements mensuels"], popular: false, sort_order: 20 },
  { code: "MERCHANT_PRO", audience: "MERCHANT", name: "Merchant Pro", tagline: "Croissance et analytics avancés", price_monthly: 49, price_annual: 497, features: ["Tout Merchant Basic", "Campagnes avancées", "Demandes de paiement illimitées", "Analytics détaillés"], popular: true, sort_order: 21 },
];

export function localizePlan(p, t) {
  const def = DEFAULT_PLANS.find((d) => d.code === p.code);
  if (!def) return p;
  return {
    ...p,
    tagline: p.tagline === def.tagline ? t(`pl.${p.code}.tag`) : p.tagline,
    features: (p.features || []).map((f, i) => (f === def.features[i] ? t(`pl.${p.code}.f${i}`) : f)),
  };
}

let cache = null;
let inflight = null;

export function loadPlans(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = entities.Plan.filter({ active: true }, "sort_order")
      .then((rows) => {
        cache = rows.length ? rows : DEFAULT_PLANS;
        return cache;
      })
      .catch(() => cache || DEFAULT_PLANS)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Active plans, optionally filtered by audience ("B2C" | "B2B" | "MERCHANT"). */
export function usePlans(audience) {
  const { t, lang } = useI18n();
  const [raw, setRaw] = useState(cache || DEFAULT_PLANS);
  useEffect(() => {
    loadPlans().then(setRaw);
  }, []);
  // Texts still equal to the seeded defaults follow the visitor's language;
  // anything an admin has customised is shown exactly as stored.
  const plans = useMemo(() => raw.map((p) => localizePlan(p, t)), [raw, lang]);
  const list = audience ? plans.filter((p) => p.audience === audience) : plans;
  return { plans: list, byCode: (code) => plans.find((p) => p.code === code) };
}

/** Annual saving vs 12 monthly payments, as a whole percentage. */
export const annualSaving = (p) =>
  p.price_monthly > 0 ? Math.round((1 - p.price_annual / (p.price_monthly * 12)) * 100) : 0;
