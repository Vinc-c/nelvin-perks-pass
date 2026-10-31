// Nelvin Benefits — PaymentRouter abstraction layer (client side).
// Dynamically selects the best PSP for a given payment context across 6 gateways.
// Kept in sync with supabase/functions/_shared/paymentRouter.ts (server side).

export const PSPS = [
  { id: "paddle", name: "Paddle", region: "Global", useCase: "B2B SaaS Merchant of Record, international invoicing, automatic tax", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "stripe", name: "Stripe", region: "International", useCase: "International cards, Apple Pay, Google Pay", methods: ["CARD", "APPLE_PAY", "GOOGLE_PAY"] },
  { id: "paystack", name: "Paystack", region: "West Africa", useCase: "Cards & bank transfer in Nigeria, Ghana, ECOWAS", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "flutterwave", name: "Flutterwave", region: "Pan-Afrique", useCase: "MTN MoMo, Orange Money, M-Pesa, Wave, local payments", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "payunit", name: "Payunit", region: "CEMAC", useCase: "Cameroon, Gabon, Chad — Mobile Money & card aggregation", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "korapay", name: "Korapay", region: "West Africa", useCase: "Nigeria & Ghana — cards & bank transfer (backup)", methods: ["CARD", "BANK_TRANSFER"] },
];

// Country (French name, matching src/data/africanCountries.js) → preferred PSP.
// Covers all 54 African countries so routing always resolves to a real gateway.
const COUNTRY_PSP = {
  // Afrique du Nord → Stripe (cartes internationales)
  Algérie: "stripe", Égypte: "stripe", Libye: "stripe", Maroc: "stripe", Soudan: "stripe", Tunisie: "stripe",
  // Afrique de l'Ouest → Paystack
  Nigeria: "paystack", Ghana: "paystack", "Côte d'Ivoire": "paystack", Sénégal: "paystack",
  Bénin: "paystack", "Burkina Faso": "paystack", Mali: "paystack", Niger: "paystack", Togo: "paystack",
  "Sierra Leone": "paystack", Liberia: "paystack", Gambie: "paystack", Guinée: "paystack",
  "Guinée-Bissau": "paystack", Mauritanie: "paystack", "Cap-Vert": "paystack",
  // Afrique Centrale (CEMAC) → Payunit
  Cameroun: "payunit", Gabon: "payunit", Tchad: "payunit", Congo: "payunit",
  "République démocratique du Congo": "payunit", "République centrafricaine": "payunit",
  "Guinée équatoriale": "payunit", "São Tomé-et-Príncipe": "payunit",
  // Afrique de l'Est → Flutterwave (Mobile Money)
  Kenya: "flutterwave", Tanzanie: "flutterwave", Ouganda: "flutterwave", Rwanda: "flutterwave",
  Éthiopie: "flutterwave", "Soudan du Sud": "flutterwave", Somalie: "flutterwave", Mozambique: "flutterwave",
  Madagascar: "flutterwave", Malawi: "flutterwave", Maurice: "flutterwave", Seychelles: "flutterwave",
  Comores: "flutterwave", Djibouti: "flutterwave", Érythrée: "flutterwave", Burundi: "flutterwave",
  // Afrique Australe → Flutterwave
  Angola: "flutterwave", Botswana: "flutterwave", Eswatini: "flutterwave", Lesotho: "flutterwave",
  Namibie: "flutterwave", "Afrique du Sud": "flutterwave", Zambie: "flutterwave", Zimbabwe: "flutterwave",
};

/** Ideal PSP for a payment context, ignoring which providers are enabled. */
function idealRoute({ audience, method, country }) {
  const find = (id) => PSPS.find((p) => p.id === id);
  const countryPspId = country && COUNTRY_PSP[country];

  // 1. SaaS B2B corporate billing → Paddle (Merchant of Record)
  if (audience === "B2B") {
    return {
      primary: find("paddle"),
      fallback: [find("stripe")],
      reason: "B2B billing routed to Paddle (Merchant of Record + automated tax invoicing).",
    };
  }

  // 2. Apple Pay / Google Pay → Stripe only
  if (method === "APPLE_PAY" || method === "GOOGLE_PAY") {
    return {
      primary: find("stripe"),
      fallback: [],
      reason: `${method} is supported exclusively by Stripe (international card wallets).`,
    };
  }

  // 3. Mobile Money → Flutterwave (Pan-Afrique) sauf CEMAC → Payunit
  if (method === "MOBILE_MONEY") {
    const primary = countryPspId === "payunit" ? find("payunit") : find("flutterwave");
    const fallback = ["flutterwave", "payunit", "korapay"]
      .map(find)
      .filter((p) => p.id !== primary.id);
    return {
      primary,
      fallback,
      reason: `Mobile Money routed to ${primary.name} for ${country || "Pan-Africa"}.`,
    };
  }

  // 4. Carte / virement → PSP du pays s'il supporte la méthode, sinon Stripe
  if (countryPspId && find(countryPspId).methods.includes(method)) {
    const psp = find(countryPspId);
    return {
      primary: psp,
      fallback: [find("stripe"), find("korapay")].filter((p) => p.id !== psp.id),
      reason: `${method === "BANK_TRANSFER" ? "Bank transfer" : "Card payment"} in ${country} routed to ${psp.name}.`,
    };
  }

  // 5. Default → Stripe (international)
  return {
    primary: find("stripe"),
    fallback: [find("paddle"), find("korapay")],
    reason: `International payment (${method || "card"}) routed to Stripe.`,
  };
}

/**
 * Selects the PSP for a payment. Mirrors the server: the ideal route is used
 * when its provider is enabled in Admin → PSP, otherwise the first enabled
 * fallback, then any enabled provider supporting the method (in the order of
 * `enabled`, i.e. admin priority). Providers with stored keys are preferred;
 * when none has stored keys, every enabled provider is considered.
 * @param {object} ctx { audience, method, country }
 * @param {{id: string, methods?: string[], has_secret?: boolean}[]} [enabled] enabled providers, by priority
 * @returns {{ primary: Object, fallback: Object[], reason: string }}
 */
export function routePayment(ctx, enabled) {
  const ideal = idealRoute(ctx);
  if (!enabled || enabled.length === 0) return ideal;
  const keyed = enabled.filter((e) => e.has_secret);
  const pool = keyed.length > 0 ? keyed : enabled;
  const usable = (p) => pool.some((e) => e.id === p.id && (!e.methods?.length || e.methods.includes(ctx.method)));
  const chain = [ideal.primary, ...ideal.fallback];
  const pick = chain.find(usable) ||
    PSPS.filter(usable).sort((a, b) => pool.findIndex((e) => e.id === a.id) - pool.findIndex((e) => e.id === b.id))[0];
  if (!pick) throw new Error("No active payment provider for this method.");
  if (pick.id === ideal.primary.id) return ideal;
  return { primary: pick, fallback: chain.filter((p) => p.id !== pick.id && usable(p)), reason: `${ideal.primary.name} unavailable: payment routed to ${pick.name}.` };
}
