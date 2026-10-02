// Nelvin Benefits — PaymentRouter (server-side, shared across backend functions)
// Mirrors the client router in src/lib/paymentRouter.js. Cannot be imported by
// the frontend (base44/ is server-only), so both copies are kept in sync.

import { secrets } from "base44:runtime";

export const PSPS = [
  { id: "paddle", name: "Paddle", region: "Global", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "stripe", name: "Stripe", region: "Global", methods: ["CARD", "APPLE_PAY", "GOOGLE_PAY"] },
  { id: "paystack", name: "Paystack", region: "West & South Africa", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "flutterwave", name: "Flutterwave", region: "Pan-Africa", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "payunit", name: "Payunit", region: "CEMAC", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "korapay", name: "Korapay", region: "West Africa", methods: ["CARD", "BANK_TRANSFER"] },
];

// Country (French name, matching src/data/africanCountries.js) → preferred PSP.
// Covers all 54 African countries so routing always resolves to a real gateway.
const COUNTRY_PSP: Record<string, string> = {
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
 * Selects the optimal Nelvin PSP for a payment context.
 */
export function routePayment({ audience, method, country }: { audience: string; method: string; country?: string; currency?: string }) {
  const find = (id: string) => PSPS.find((p) => p.id === id)!;
  const countryPspId = country && COUNTRY_PSP[country];

  // 1. SaaS B2B corporate billing → Paddle (Merchant of Record)
  if (audience === "B2B") {
    return { primary: find("paddle"), fallback: [find("stripe")], reason: "Facturation B2B routée vers Paddle (Merchant of Record + facturation fiscale)." };
  }

  // 2. Apple Pay / Google Pay → Stripe only
  if (method === "APPLE_PAY" || method === "GOOGLE_PAY") {
    return { primary: find("stripe"), fallback: [], reason: `${method} pris en charge exclusivement par Stripe.` };
  }

  // 3. Mobile Money → Flutterwave (Pan-Afrique) sauf CEMAC → Payunit
  if (method === "MOBILE_MONEY") {
    const primary = countryPspId === "payunit" ? find("payunit") : find("flutterwave");
    const fallback = ["flutterwave", "payunit", "korapay"].map(find).filter((p) => p.id !== primary.id);
    return { primary, fallback, reason: `Mobile Money routé vers ${primary.name} pour ${country || "Pan-Afrique"}.` };
  }

  // 4. Carte / virement → PSP du pays s'il supporte la méthode, sinon Stripe
  if (countryPspId && find(countryPspId).methods.includes(method)) {
    const psp = find(countryPspId);
    const fallback = [find("stripe"), find("korapay")].filter((p) => p.id !== psp.id);
    const label = method === "BANK_TRANSFER" ? "Virement" : "Paiement carte";
    return { primary: psp, fallback, reason: `${label} en ${country} routé vers ${psp.name}.` };
  }

  // 5. Default → Stripe (international)
  return { primary: find("stripe"), fallback: [find("paddle"), find("korapay")], reason: `Paiement international (${method || "carte"}) routé vers Stripe.` };
}

// ---------------------------------------------------------------------------
// Hosted-checkout initialization — one real implementation per PSP.
// Each returns { authorization_url, reference, provider_ref }.
// A missing secret throws a clear "configure <KEY>" error the user can act on.
// ---------------------------------------------------------------------------

export interface InitCtx {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: any;
}

function appendQuery(base: string, params: Record<string, string>): string {
  const [path, search] = String(base || "").split("?");
  const sp = new URLSearchParams(search || "");
  for (const [k, v] of Object.entries(params)) sp.set(k, v);
  return `${path}?${sp.toString()}`;
}

export async function initPayment(pspId: string, ctx: InitCtx): Promise<{ authorization_url: string; reference: string; provider_ref: string }> {
  switch (pspId) {
    case "stripe": return initStripe(ctx);
    case "paystack": return initPaystack(ctx);
    case "flutterwave": return initFlutterwave(ctx);
    case "paddle": return initPaddle(ctx);
    case "payunit": return initPayunit(ctx);
    case "korapay": return initKorapay(ctx);
    default: throw new Error("PSP inconnu: " + pspId);
  }
}

async function initStripe(ctx: InitCtx) {
  const key = secrets.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY non configuré — ajoutez votre clé Stripe dans Secrets.");
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", String(ctx.currency).toLowerCase());
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(ctx.amount * 100)));
  params.set("line_items[0][price_data][product_data][name]", "Nelvin Wallet Recharge");
  params.set("client_reference_id", ctx.reference);
  if (ctx.email) params.set("customer_email", ctx.email);
  const success = appendQuery(ctx.callback_url, { psp: "stripe", ref: ctx.reference, status: "success" });
  const cancel = appendQuery(ctx.callback_url, { psp: "stripe", ref: ctx.reference, status: "cancel" });
  params.set("success_url", `${success}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", cancel);
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data: any = await res.json();
  if (!data.url) throw new Error("Stripe: " + (data.error?.message || res.status));
  return { authorization_url: data.url, reference: ctx.reference, provider_ref: data.id };
}

async function initPaystack(ctx: InitCtx) {
  const key = secrets.get("PAYSTACK_SECRET_KEY");
  if (!key) throw new Error("PAYSTACK_SECRET_KEY non configuré — ajoutez votre clé Paystack dans Secrets.");
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.email || "customer@nelvin.app",
      amount: Math.round(ctx.amount * 100),
      currency: String(ctx.currency).toUpperCase(),
      reference: ctx.reference,
      callback_url: appendQuery(ctx.callback_url, { psp: "paystack", ref: ctx.reference, status: "success" }),
      metadata: ctx.metadata || {},
    }),
  });
  const data: any = await res.json();
  if (!data.data?.authorization_url) throw new Error("Paystack: " + (data.message || res.status));
  return { authorization_url: data.data.authorization_url, reference: ctx.reference, provider_ref: data.data.reference || ctx.reference };
}

async function initFlutterwave(ctx: InitCtx) {
  const key = secrets.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY non configuré — ajoutez votre clé Flutterwave dans Secrets.");
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: ctx.reference,
      amount: ctx.amount,
      currency: String(ctx.currency).toUpperCase(),
      redirect_url: appendQuery(ctx.callback_url, { psp: "flutterwave", ref: ctx.reference }),
      customer: { email: ctx.email || "customer@nelvin.app" },
      payment_options: "card, mobilemoney, banktransfer, ussd",
      customizations: { title: "Nelvin" },
    }),
  });
  const data: any = await res.json();
  if (!data.data?.link) throw new Error("Flutterwave: " + (data.message || res.status));
  return { authorization_url: data.data.link, reference: ctx.reference, provider_ref: ctx.reference };
}

async function initPaddle(ctx: InitCtx) {
  const key = secrets.get("PADDLE_API_KEY");
  if (!key) throw new Error("PADDLE_API_KEY non configuré — ajoutez votre clé Paddle dans Secrets.");
  const res = await fetch("https://api.paddle.com/transactions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{
        quantity: 1,
        price: {
          unit_price: { amount: String(ctx.amount.toFixed(2)), currency_code: String(ctx.currency).toLowerCase() },
          product: { name: "Nelvin Wallet Recharge", type: "standard", tax_mode: "digital" },
        },
      }],
      checkout: { url: appendQuery(ctx.callback_url, { psp: "paddle", ref: ctx.reference }) },
      custom_data: { nelvin_reference: ctx.reference },
    }),
  });
  const data: any = await res.json();
  const url = data.data?.checkout?.url;
  if (!url) throw new Error("Paddle: " + (data.error?.detail || res.status));
  return { authorization_url: url, reference: ctx.reference, provider_ref: data.data.id };
}

async function initPayunit(ctx: InitCtx) {
  const apiKey = secrets.get("PAYUNIT_API_KEY");
  const username = secrets.get("PAYUNIT_API_USERNAME");
  const password = secrets.get("PAYUNIT_API_PASSWORD");
  if (!apiKey || !username || !password) {
    throw new Error("Payunit non configuré — ajoutez PAYUNIT_API_KEY, PAYUNIT_API_USERNAME et PAYUNIT_API_PASSWORD dans Secrets.");
  }
  const basic = btoa(`${username}:${password}`);
  const country = (ctx.metadata?.payment_country) || "CM";
  const res = await fetch("https://api.payunit.net/api/gateway/initialize", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      mode: "live",
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      total_amount: ctx.amount,
      currency: String(ctx.currency).toUpperCase(),
      transaction_id: ctx.reference,
      return_url: appendQuery(ctx.callback_url, { psp: "payunit", ref: ctx.reference }),
      notify_url: appendQuery(ctx.callback_url, { psp: "payunit", ref: ctx.reference }),
      payment_country: country,
    }),
  });
  const data: any = await res.json();
  if (!data.data?.transaction_url) throw new Error("Payunit: " + (data.message || res.status));
  return { authorization_url: data.data.transaction_url, reference: ctx.reference, provider_ref: ctx.reference };
}

async function initKorapay(ctx: InitCtx) {
  const key = secrets.get("KORAPAY_SECRET_KEY");
  if (!key) throw new Error("KORAPAY_SECRET_KEY non configuré — ajoutez votre clé Korapay dans Secrets.");
  const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: ctx.reference,
      amount: Math.round(ctx.amount * 100),
      currency: String(ctx.currency).toUpperCase(),
      redirect_url: appendQuery(ctx.callback_url, { psp: "korapay", ref: ctx.reference }),
      customer: { name: ctx.metadata?.name || "Nelvin User", email: ctx.email || "customer@nelvin.app" },
      narration: "Nelvin Wallet Recharge",
    }),
  });
  const data: any = await res.json();
  if (!data.data?.checkout_url) throw new Error("Korapay: " + (data.message || res.status));
  return { authorization_url: data.data.checkout_url, reference: ctx.reference, provider_ref: ctx.reference };
}

// ---------------------------------------------------------------------------
// Verification — confirm a payment with the PSP after the user is redirected
// back. Returns { ok, status, amount, currency } or throws on error.
// ---------------------------------------------------------------------------

export async function verifyPayment(pspId: string, ref: string, providerRef?: string): Promise<{ ok: boolean; status: string }> {
  switch (pspId) {
    case "stripe": return verifyStripe(ref, providerRef);
    case "paystack": return verifyPaystack(ref);
    case "flutterwave": return verifyFlutterwave(providerRef || ref);
    case "paddle": return verifyPaddle(providerRef || ref);
    case "payunit": return verifyPayunit(ref);
    case "korapay": return verifyKorapay(ref);
    default: throw new Error("PSP inconnu: " + pspId);
  }
}

async function verifyStripe(ref: string, providerRef?: string) {
  const key = secrets.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY non configuré.");
  if (!providerRef) throw new Error("Session Stripe manquante.");
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${providerRef}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data: any = await res.json();
  const ok = data.payment_status === "paid";
  return { ok, status: data.payment_status || "unknown" };
}

async function verifyPaystack(ref: string) {
  const key = secrets.get("PAYSTACK_SECRET_KEY");
  if (!key) throw new Error("PAYSTACK_SECRET_KEY non configuré.");
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data: any = await res.json();
  const ok = data.data?.status === "success";
  return { ok, status: data.data?.status || "unknown" };
}

async function verifyFlutterwave(id: string) {
  const key = secrets.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY non configuré.");
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(id)}/verify`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data: any = await res.json();
  const ok = data.data?.status === "successful" || data.status === "success";
  return { ok, status: data.data?.status || "unknown" };
}

async function verifyPaddle(id: string) {
  const key = secrets.get("PADDLE_API_KEY");
  if (!key) throw new Error("PADDLE_API_KEY non configuré.");
  const res = await fetch(`https://api.paddle.com/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data: any = await res.json();
  const ok = data.data?.status === "completed" || data.data?.status === "billed" || data.data?.status === "paid";
  return { ok, status: data.data?.status || "unknown" };
}

async function verifyPayunit(ref: string) {
  const apiKey = secrets.get("PAYUNIT_API_KEY");
  const username = secrets.get("PAYUNIT_API_USERNAME");
  const password = secrets.get("PAYUNIT_API_PASSWORD");
  if (!apiKey || !username || !password) throw new Error("Payunit non configuré.");
  const basic = btoa(`${username}:${password}`);
  const res = await fetch("https://api.payunit.net/api/gateway/checkstatus", {
    method: "POST",
    headers: { "x-api-key": apiKey, mode: "live", Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: ref }),
  });
  const data: any = await res.json().catch(() => ({}));
  const ok = data.data?.payment_status === "SUCCESS" || data.status === "SUCCESS";
  return { ok, status: data.data?.payment_status || data.status || "unknown" };
}

async function verifyKorapay(ref: string) {
  const key = secrets.get("KORAPAY_SECRET_KEY");
  if (!key) throw new Error("KORAPAY_SECRET_KEY non configuré.");
  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data: any = await res.json();
  const status = data.data?.status || data.status || "unknown";
  const ok = status === "success";
  return { ok, status };
}