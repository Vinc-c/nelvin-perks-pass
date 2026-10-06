// Nelvin Benefits — PaymentRouter abstraction layer (client side).
// Dynamically selects the best PSP for a given payment context across 6 gateways.
// Kept in sync with supabase/functions/_shared/paymentRouter.ts (server side).

export const PSPS = [
  { id: "paddle", name: "Paddle", region: "Global", useCase: "SaaS B2B Merchant of Record, facturation internationale, taxe auto", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "stripe", name: "Stripe", region: "Global / MENA", useCase: "Cartes internationales, Apple Pay, Google Pay", methods: ["CARD", "APPLE_PAY", "GOOGLE_PAY"] },
  { id: "paystack", name: "Paystack", region: "Afrique de l'Ouest", useCase: "Cartes & virement Nigeria, Ghana, CEDEAO", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "flutterwave", name: "Flutterwave", region: "Pan-Afrique", useCase: "MTN MoMo, Orange Money, M-Pesa, Wave, paiements locaux", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "payunit", name: "Payunit", region: "CEMAC", useCase: "Cameroun, Gabon, Tchad — agrégation Mobile Money & carte", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "korapay", name: "Korapay", region: "Afrique de l'Ouest", useCase: "Nigeria & Ghana — cartes & virement (secours)", methods: ["CARD", "BANK_TRANSFER"] },
];

// Country (French name, matching src/data/africanCountries.js) → preferred PSP.
// Covers all 54 African countries so routing always resolves to a real gateway.
const COUNTRY_PSP = {
  // Afrique du Nord → Stripe (cartes internationales / MENA)
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

/**
 * Selects the optimal PSP for a payment.
 * @returns {{ primary: Object, fallback: Object[], reason: string }}
 */
export function routePayment({ audience, method, country, currency }) {
  const find = (id) => PSPS.find((p) => p.id === id);
  const countryPspId = country && COUNTRY_PSP[country];

  // 1. SaaS B2B corporate billing → Paddle (Merchant of Record)
  if (audience === "B2B") {
    return {
      primary: find("paddle"),
      fallback: [find("stripe")],
      reason: "Facturation B2B routée vers Paddle (Merchant of Record + facturation fiscale automatisée).",
    };
  }

  // 2. Apple Pay / Google Pay → Stripe only
  if (method === "APPLE_PAY" || method === "GOOGLE_PAY") {
    return {
      primary: find("stripe"),
      fallback: [],
      reason: `${method} pris en charge exclusivement par Stripe (wallets cartes internationaux).`,
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
      reason: `Mobile Money routé vers ${primary.name} pour ${country || "Pan-Afrique"}.`,
    };
  }

  // 4. Carte / virement → PSP du pays s'il supporte la méthode, sinon Stripe
  if (countryPspId && find(countryPspId).methods.includes(method)) {
    const psp = find(countryPspId);
    return {
      primary: psp,
      fallback: [find("stripe"), find("korapay")].filter((p) => p.id !== psp.id),
      reason: `${method === "BANK_TRANSFER" ? "Virement" : "Paiement carte"} en ${country} routé vers ${psp.name}.`,
    };
  }

  // 5. Default → Stripe (international)
  return {
    primary: find("stripe"),
    fallback: [find("paddle"), find("korapay")],
    reason: `Paiement international (${method || "carte"}) routé vers Stripe.`,
  };
}