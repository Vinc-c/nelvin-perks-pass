// Nelvin Benefits — PaymentRouter (server side, shared by Edge Functions).
// Mirrors the client router in src/lib/paymentRouter.js (keep both in sync).
//
// PSP configuration is managed by super admins in the app (Admin → PSP):
// enabled providers, live/test mode and API keys stored encrypted in Supabase
// Vault. Edge Function environment secrets remain a fallback.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type PspConfig = { id: string; live_mode: boolean; public_key: string | null; methods: string[]; has_secret: boolean };

/** Per-request PSP context: enabled providers + lazily loaded secrets. */
export class PspContext {
  private cache = new Map<string, Record<string, string>>();
  constructor(private admin: SupabaseClient, public enabled: PspConfig[]) {}

  static async load(admin: SupabaseClient): Promise<PspContext> {
    const { data, error } = await admin.rpc("active_psp_config");
    if (error) throw error;
    return new PspContext(admin, (data || []) as PspConfig[]);
  }

  config(id: string): PspConfig | undefined {
    return this.enabled.find((p) => p.id === id);
  }

  async secrets(id: string): Promise<Record<string, string>> {
    if (!this.cache.has(id)) {
      const { data, error } = await this.admin.rpc("get_psp_secrets", { p_provider: id });
      if (error) throw error;
      this.cache.set(id, (data || {}) as Record<string, string>);
    }
    return this.cache.get(id)!;
  }

  /** Reads the given keys (Vault first, then env); throws a clear error when missing. */
  async need(id: string, ...keys: string[]): Promise<string[]> {
    const stored = await this.secrets(id);
    const values = keys.map((k) => stored[k] || Deno.env.get(k) || "");
    const missing = keys.filter((_, i) => !values[i]);
    if (missing.length) {
      throw new Error(`${missing.join(", ")} non configuré — renseignez la clé dans Admin → PSP.`);
    }
    return values;
  }

  liveMode(id: string): boolean {
    return this.config(id)?.live_mode ?? true;
  }
}

export const PSPS = [
  { id: "paddle", name: "Paddle", region: "Global", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "stripe", name: "Stripe", region: "Global", methods: ["CARD", "APPLE_PAY", "GOOGLE_PAY"] },
  { id: "paystack", name: "Paystack", region: "West & South Africa", methods: ["CARD", "BANK_TRANSFER"] },
  { id: "flutterwave", name: "Flutterwave", region: "Pan-Africa", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "payunit", name: "Payunit", region: "CEMAC", methods: ["MOBILE_MONEY", "CARD"] },
  { id: "korapay", name: "Korapay", region: "West Africa", methods: ["CARD", "BANK_TRANSFER"] },
];

// Country (French name, matching src/data/africanCountries.js) → preferred PSP.
const COUNTRY_PSP: Record<string, string> = {
  Algérie: "stripe", Égypte: "stripe", Libye: "stripe", Maroc: "stripe", Soudan: "stripe", Tunisie: "stripe",
  Nigeria: "paystack", Ghana: "paystack", "Côte d'Ivoire": "paystack", Sénégal: "paystack",
  Bénin: "paystack", "Burkina Faso": "paystack", Mali: "paystack", Niger: "paystack", Togo: "paystack",
  "Sierra Leone": "paystack", Liberia: "paystack", Gambie: "paystack", Guinée: "paystack",
  "Guinée-Bissau": "paystack", Mauritanie: "paystack", "Cap-Vert": "paystack",
  Cameroun: "payunit", Gabon: "payunit", Tchad: "payunit", Congo: "payunit",
  "République démocratique du Congo": "payunit", "République centrafricaine": "payunit",
  "Guinée équatoriale": "payunit", "São Tomé-et-Príncipe": "payunit",
  Kenya: "flutterwave", Tanzanie: "flutterwave", Ouganda: "flutterwave", Rwanda: "flutterwave",
  Éthiopie: "flutterwave", "Soudan du Sud": "flutterwave", Somalie: "flutterwave", Mozambique: "flutterwave",
  Madagascar: "flutterwave", Malawi: "flutterwave", Maurice: "flutterwave", Seychelles: "flutterwave",
  Comores: "flutterwave", Djibouti: "flutterwave", Érythrée: "flutterwave", Burundi: "flutterwave",
  Angola: "flutterwave", Botswana: "flutterwave", Eswatini: "flutterwave", Lesotho: "flutterwave",
  Namibie: "flutterwave", "Afrique du Sud": "flutterwave", Zambie: "flutterwave", Zimbabwe: "flutterwave",
};

type Psp = (typeof PSPS)[number];
type Route = { primary: Psp; fallback: Psp[]; reason: string };

function idealRoute({ audience, method, country }: { audience: string; method: string; country?: string }): Route {
  const find = (id: string): Psp => PSPS.find((p) => p.id === id)!;
  const countryPspId = country ? COUNTRY_PSP[country] : undefined;

  if (audience === "B2B") {
    return { primary: find("paddle"), fallback: [find("stripe")], reason: "Facturation B2B routée vers Paddle (Merchant of Record + facturation fiscale)." };
  }
  if (method === "APPLE_PAY" || method === "GOOGLE_PAY") {
    return { primary: find("stripe"), fallback: [], reason: `${method} pris en charge exclusivement par Stripe.` };
  }
  if (method === "MOBILE_MONEY") {
    const primary = countryPspId === "payunit" ? find("payunit") : find("flutterwave");
    const fallback = ["flutterwave", "payunit", "korapay"].map(find).filter((p) => p.id !== primary.id);
    return { primary, fallback, reason: `Mobile Money routé vers ${primary.name} pour ${country || "Pan-Afrique"}.` };
  }
  if (countryPspId && find(countryPspId).methods.includes(method)) {
    const psp = find(countryPspId);
    const fallback = [find("stripe"), find("korapay")].filter((p) => p.id !== psp.id);
    const label = method === "BANK_TRANSFER" ? "Virement" : "Paiement carte";
    return { primary: psp, fallback, reason: `${label} en ${country} routé vers ${psp.name}.` };
  }
  return { primary: find("stripe"), fallback: [find("paddle"), find("korapay")], reason: `Paiement international (${method || "carte"}) routé vers Stripe.` };
}

/**
 * Picks the PSP for a payment. The ideal route is followed when its provider
 * is enabled (Admin → PSP); otherwise the first enabled fallback, then any
 * enabled provider supporting the method. When no provider is enabled in the
 * admin, the ideal route is used as-is (keys may come from env secrets).
 */
export function routePayment(
  ctx: { audience: string; method: string; country?: string; currency?: string },
  enabled?: PspConfig[],
): Route {
  const ideal = idealRoute(ctx);
  if (!enabled || enabled.length === 0) return ideal;
  const usable = (p: Psp) => enabled.some((e) => e.id === p.id && (e.methods.length === 0 || e.methods.includes(ctx.method)));
  const chain = [ideal.primary, ...ideal.fallback];
  const pick = chain.find(usable) ||
    PSPS.filter(usable).sort((a, b) => enabled.findIndex((e) => e.id === a.id) - enabled.findIndex((e) => e.id === b.id))[0];
  if (!pick) throw new Error("Aucun moyen de paiement actif pour cette méthode. Contactez le support.");
  if (pick.id === ideal.primary.id) return ideal;
  return {
    primary: pick,
    fallback: chain.filter((p) => p.id !== pick.id && usable(p)),
    reason: `${ideal.primary.name} indisponible : paiement routé vers ${pick.name}.`,
  };
}

// ---------------------------------------------------------------------------
// Hosted-checkout initialization
// ---------------------------------------------------------------------------

export interface InitCtx {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}

export type InitResult = { authorization_url: string; reference: string; provider_ref: string };

function appendQuery(base: string, params: Record<string, string>): string {
  const [path, search] = String(base || "").split("?");
  const sp = new URLSearchParams(search || "");
  for (const [k, v] of Object.entries(params)) sp.set(k, v);
  return `${path}?${sp.toString()}`;
}

// deno-lint-ignore no-explicit-any
type Any = any;

const paddleBase = (psp: PspContext) =>
  psp.liveMode("paddle") ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

export function initPayment(psp: PspContext, pspId: string, ctx: InitCtx): Promise<InitResult> {
  switch (pspId) {
    case "stripe": return initStripe(psp, ctx);
    case "paystack": return initPaystack(psp, ctx);
    case "flutterwave": return initFlutterwave(psp, ctx);
    case "paddle": return initPaddle(psp, ctx);
    case "payunit": return initPayunit(psp, ctx);
    case "korapay": return initKorapay(psp, ctx);
    default: throw new Error("PSP inconnu: " + pspId);
  }
}

/** Our webhook endpoint for PSPs that take a per-payment notification URL. */
function webhookUrl(pspId: string, ref?: string): string {
  const base = `${(Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "")}/functions/v1/payment-webhook?psp=${pspId}`;
  return ref ? `${base}&ref=${encodeURIComponent(ref)}` : base;
}

async function initStripe(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [key] = await psp.need("stripe", "STRIPE_SECRET_KEY");
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", ctx.currency.toLowerCase());
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
  const data: Any = await res.json();
  if (!data.url) throw new Error("Stripe: " + (data.error?.message || res.status));
  return { authorization_url: data.url, reference: ctx.reference, provider_ref: data.id };
}

async function initPaystack(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [key] = await psp.need("paystack", "PAYSTACK_SECRET_KEY");
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.email || "customer@nelvin.app",
      amount: Math.round(ctx.amount * 100),
      currency: ctx.currency.toUpperCase(),
      reference: ctx.reference,
      callback_url: appendQuery(ctx.callback_url, { psp: "paystack", ref: ctx.reference, status: "success" }),
      metadata: ctx.metadata || {},
    }),
  });
  const data: Any = await res.json();
  if (!data.data?.authorization_url) throw new Error("Paystack: " + (data.message || res.status));
  return { authorization_url: data.data.authorization_url, reference: ctx.reference, provider_ref: data.data.reference || ctx.reference };
}

async function initFlutterwave(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [key] = await psp.need("flutterwave", "FLUTTERWAVE_SECRET_KEY");
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: ctx.reference,
      amount: ctx.amount,
      currency: ctx.currency.toUpperCase(),
      redirect_url: appendQuery(ctx.callback_url, { psp: "flutterwave", ref: ctx.reference }),
      customer: { email: ctx.email || "customer@nelvin.app" },
      payment_options: "card, mobilemoney, banktransfer, ussd",
      customizations: { title: "Nelvin" },
    }),
  });
  const data: Any = await res.json();
  if (!data.data?.link) throw new Error("Flutterwave: " + (data.message || res.status));
  return { authorization_url: data.data.link, reference: ctx.reference, provider_ref: ctx.reference };
}

async function initPaddle(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [key] = await psp.need("paddle", "PADDLE_API_KEY");
  const res = await fetch(`${paddleBase(psp)}/transactions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{
        quantity: 1,
        price: {
          description: "Nelvin Wallet Recharge",
          unit_price: { amount: String(Math.round(ctx.amount * 100)), currency_code: ctx.currency.toUpperCase() },
          product: { name: "Nelvin Wallet Recharge", tax_category: "standard" },
        },
      }],
      checkout: { url: appendQuery(ctx.callback_url, { psp: "paddle", ref: ctx.reference }) },
      custom_data: { nelvin_reference: ctx.reference },
    }),
  });
  const data: Any = await res.json();
  const url = data.data?.checkout?.url;
  if (!url) throw new Error("Paddle: " + (data.error?.detail || res.status));
  return { authorization_url: url, reference: ctx.reference, provider_ref: data.data.id };
}

async function initPayunit(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [apiKey, username, password] = await psp.need("payunit", "PAYUNIT_API_KEY", "PAYUNIT_API_USERNAME", "PAYUNIT_API_PASSWORD");
  const basic = btoa(`${username}:${password}`);
  const res = await fetch("https://api.payunit.net/api/gateway/initialize", {
    method: "POST",
    headers: { "x-api-key": apiKey, mode: psp.liveMode("payunit") ? "live" : "test", Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      total_amount: ctx.amount,
      currency: ctx.currency.toUpperCase(),
      transaction_id: ctx.reference,
      return_url: appendQuery(ctx.callback_url, { psp: "payunit", ref: ctx.reference }),
      notify_url: webhookUrl("payunit", ctx.reference),
      payment_country: String(ctx.metadata?.payment_country || "CM"),
    }),
  });
  const data: Any = await res.json();
  if (!data.data?.transaction_url) throw new Error("Payunit: " + (data.message || res.status));
  return { authorization_url: data.data.transaction_url, reference: ctx.reference, provider_ref: ctx.reference };
}

async function initKorapay(psp: PspContext, ctx: InitCtx): Promise<InitResult> {
  const [key] = await psp.need("korapay", "KORAPAY_SECRET_KEY");
  const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: ctx.reference,
      amount: ctx.amount,
      currency: ctx.currency.toUpperCase(),
      redirect_url: appendQuery(ctx.callback_url, { psp: "korapay", ref: ctx.reference }),
      customer: { name: String(ctx.metadata?.name || "Nelvin User"), email: ctx.email || "customer@nelvin.app" },
      narration: "Nelvin Wallet Recharge",
      notification_url: webhookUrl("korapay"),
    }),
  });
  const data: Any = await res.json();
  if (!data.data?.checkout_url) throw new Error("Korapay: " + (data.message || res.status));
  return { authorization_url: data.data.checkout_url, reference: ctx.reference, provider_ref: ctx.reference };
}

// ---------------------------------------------------------------------------
// Verification. Every PSP result is checked against OUR reference and the
// expected amount/currency, so a paid session for another (smaller) payment
// can never confirm this recharge.
// ---------------------------------------------------------------------------

export type Expected = { reference: string; providerRef?: string | null; amount: number; currency: string };
export type VerifyResult = { ok: boolean; status: string };

function matches(
  exp: Expected,
  got: { reference?: string | null; amount?: number | null; currency?: string | null },
): boolean {
  if (got.reference != null && got.reference !== exp.reference) return false;
  if (got.amount != null && Math.abs(Number(got.amount) - exp.amount) > 0.01) return false;
  if (got.currency != null && String(got.currency).toUpperCase() !== exp.currency.toUpperCase()) return false;
  return true;
}

export function verifyPayment(psp: PspContext, pspId: string, exp: Expected): Promise<VerifyResult> {
  switch (pspId) {
    case "stripe": return verifyStripe(psp, exp);
    case "paystack": return verifyPaystack(psp, exp);
    case "flutterwave": return verifyFlutterwave(psp, exp);
    case "paddle": return verifyPaddle(psp, exp);
    case "payunit": return verifyPayunit(psp, exp);
    case "korapay": return verifyKorapay(psp, exp);
    default: throw new Error("PSP inconnu: " + pspId);
  }
}

async function verifyStripe(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [key] = await psp.need("stripe", "STRIPE_SECRET_KEY");
  if (!exp.providerRef) throw new Error("Session Stripe manquante.");
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(exp.providerRef)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const d: Any = await res.json();
  const paid = d.payment_status === "paid";
  const ok = paid && matches(exp, { reference: d.client_reference_id ?? "", amount: d.amount_total / 100, currency: d.currency });
  return { ok, status: paid && !ok ? "mismatch" : d.payment_status || "unknown" };
}

async function verifyPaystack(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [key] = await psp.need("paystack", "PAYSTACK_SECRET_KEY");
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(exp.reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const d: Any = (await res.json()).data || {};
  const paid = d.status === "success";
  const ok = paid && matches(exp, { reference: d.reference, amount: d.amount / 100, currency: d.currency });
  return { ok, status: paid && !ok ? "mismatch" : d.status || "unknown" };
}

async function verifyFlutterwave(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [key] = await psp.need("flutterwave", "FLUTTERWAVE_SECRET_KEY");
  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(exp.reference)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  const d: Any = (await res.json()).data || {};
  const paid = d.status === "successful";
  const ok = paid && matches(exp, { reference: d.tx_ref, amount: d.amount, currency: d.currency });
  return { ok, status: paid && !ok ? "mismatch" : d.status || "unknown" };
}

async function verifyPaddle(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [key] = await psp.need("paddle", "PADDLE_API_KEY");
  if (!exp.providerRef) throw new Error("Transaction Paddle manquante.");
  const res = await fetch(`${paddleBase(psp)}/transactions/${encodeURIComponent(exp.providerRef)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const d: Any = (await res.json()).data || {};
  const paid = ["completed", "paid", "billed"].includes(d.status);
  const total = d.details?.totals?.grand_total;
  const ok = paid && matches(exp, {
    reference: d.custom_data?.nelvin_reference ?? "",
    amount: total != null ? Number(total) / 100 : null,
    currency: d.currency_code,
  });
  return { ok, status: paid && !ok ? "mismatch" : d.status || "unknown" };
}

async function verifyPayunit(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [apiKey, username, password] = await psp.need("payunit", "PAYUNIT_API_KEY", "PAYUNIT_API_USERNAME", "PAYUNIT_API_PASSWORD");
  const basic = btoa(`${username}:${password}`);
  const res = await fetch("https://api.payunit.net/api/gateway/checkstatus", {
    method: "POST",
    headers: { "x-api-key": apiKey, mode: psp.liveMode("payunit") ? "live" : "test", Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: exp.reference }),
  });
  const d: Any = await res.json().catch(() => ({}));
  const status = d.data?.payment_status || d.status || "unknown";
  const paid = status === "SUCCESS";
  const amount = d.data?.transaction_amount ?? d.data?.amount;
  const ok = paid && matches(exp, { amount: amount != null ? Number(amount) : null });
  return { ok, status: paid && !ok ? "mismatch" : status };
}

async function verifyKorapay(psp: PspContext, exp: Expected): Promise<VerifyResult> {
  const [key] = await psp.need("korapay", "KORAPAY_SECRET_KEY");
  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(exp.reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body: Any = await res.json();
  const d: Any = body.data || {};
  const status = d.status || body.status || "unknown";
  const paid = status === "success";
  const ok = paid && matches(exp, { reference: d.reference, amount: d.amount != null ? Number(d.amount) : null, currency: d.currency });
  return { ok, status: paid && !ok ? "mismatch" : status };
}

// ---------------------------------------------------------------------------
// Connection test (Admin → PSP → "Tester"): a harmless authenticated read.
// ---------------------------------------------------------------------------
export async function testConnection(psp: PspContext, pspId: string): Promise<{ ok: boolean; message: string }> {
  const call = async (url: string, headers: Record<string, string>, init: RequestInit = {}) => {
    const res = await fetch(url, { ...init, headers });
    const body: Any = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  };
  switch (pspId) {
    case "stripe": {
      const [key] = await psp.need("stripe", "STRIPE_SECRET_KEY");
      const r = await call("https://api.stripe.com/v1/balance", { Authorization: `Bearer ${key}` });
      return { ok: r.ok, message: r.ok ? `Connecté (${key.startsWith("sk_live") ? "live" : "test"})` : r.body.error?.message || `HTTP ${r.status}` };
    }
    case "paystack": {
      const [key] = await psp.need("paystack", "PAYSTACK_SECRET_KEY");
      const r = await call("https://api.paystack.co/balance", { Authorization: `Bearer ${key}` });
      return { ok: r.ok && r.body.status !== false, message: r.body.message || `HTTP ${r.status}` };
    }
    case "flutterwave": {
      const [key] = await psp.need("flutterwave", "FLUTTERWAVE_SECRET_KEY");
      const r = await call("https://api.flutterwave.com/v3/balances", { Authorization: `Bearer ${key}` });
      return { ok: r.ok && r.body.status === "success", message: r.body.message || `HTTP ${r.status}` };
    }
    case "paddle": {
      const [key] = await psp.need("paddle", "PADDLE_API_KEY");
      const r = await call(`${paddleBase(psp)}/event-types`, { Authorization: `Bearer ${key}` });
      return { ok: r.ok, message: r.ok ? `Connecté (${psp.liveMode("paddle") ? "live" : "sandbox"})` : r.body.error?.detail || `HTTP ${r.status}` };
    }
    case "korapay": {
      const [key] = await psp.need("korapay", "KORAPAY_SECRET_KEY");
      const r = await call("https://api.korapay.com/merchant/api/v1/balances", { Authorization: `Bearer ${key}` });
      return { ok: r.ok && r.body.status !== false, message: r.body.message || `HTTP ${r.status}` };
    }
    case "payunit": {
      await psp.need("payunit", "PAYUNIT_API_KEY", "PAYUNIT_API_USERNAME", "PAYUNIT_API_PASSWORD");
      return { ok: true, message: "Clés présentes (Payunit n'expose pas d'appel de test sans transaction)." };
    }
    default:
      return { ok: false, message: "PSP inconnu" };
  }
}
