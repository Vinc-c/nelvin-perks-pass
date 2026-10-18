// Starts a hosted PSP checkout for:
//   RECHARGE       — member/employee tops up their wallet
//   SUBSCRIPTION   — membership (B2C), company plan (HR) or merchant plan
//   COMPANY_TOPUP  — HR funds the company benefits wallet
//   GIFT           — a B2C membership bought for someone else (gift code issued once paid)
// A PENDING transaction is recorded first; verify-payment completes it.
import { adminClient, errorMessage, getCaller, json, readJson, serve } from "../_shared/http.ts";
import { initPayment, PspContext, routePayment } from "../_shared/paymentRouter.ts";

const VALID_METHODS = ["CARD", "MOBILE_MONEY", "BANK_TRANSFER", "APPLE_PAY", "GOOGLE_PAY"];
const PURPOSES = ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP", "GIFT"];

function genRef(pspId: string) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `NELVIN-${pspId.toUpperCase()}-${Date.now()}-${rand}`;
}

// Only redirect back to our own app (APP_URL / ALLOWED_ORIGINS secrets).
function isAllowedCallback(url: string): boolean {
  try {
    const u = new URL(url);
    const allowed = [Deno.env.get("APP_URL"), ...(Deno.env.get("ALLOWED_ORIGINS") || "").split(",")]
      .map((s) => (s || "").trim())
      .filter(Boolean)
      .map((s) => new URL(s).origin);
    if (allowed.length === 0) return u.protocol === "https:" || u.hostname === "localhost";
    return allowed.includes(u.origin);
  } catch {
    return false;
  }
}

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  const { profile, user } = caller;

  const body = await readJson(req);
  const purpose = String(body.purpose || "RECHARGE").toUpperCase();
  if (!PURPOSES.includes(purpose)) return json({ error: "Type de paiement invalide" }, 400);
  const method = String(body.method || "CARD").toUpperCase();
  if (!VALID_METHODS.includes(method)) return json({ error: "Méthode de paiement invalide" }, 400);
  const currency = String(body.currency || profile.wallet_currency || "USD").toUpperCase().slice(0, 3);
  const country = String(body.country || profile.country || "").slice(0, 60);
  const callbackUrl = String(body.callback_url || "").slice(0, 300);
  if (!isAllowedCallback(callbackUrl)) return json({ error: "callback_url invalide (URL de retour)" }, 400);

  const { data: cur } = await admin.from("currencies").select("rate_per_usd").eq("code", currency).eq("active", true).maybeSingle();
  if (!cur) return json({ error: `Devise non supportée: ${currency}` }, 400);
  const rate = Number(cur.rate_per_usd);

  let amount = 0;
  let audience = "B2C";
  let planCode: string | null = null;
  let cycle: string | null = null;
  let description = "";
  let companyId: string | null = profile.company_id;

  if (purpose === "RECHARGE") {
    amount = Math.round(Number(body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount / rate > 100000) return json({ error: "Montant invalide" }, 400);
    description = "Recharge wallet";
  } else if (purpose === "COMPANY_TOPUP") {
    if (profile.role !== "HR_ADMIN" || !profile.company_id) return json({ error: "Réservé aux administrateurs RH" }, 403);
    amount = Math.round(Number(body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount / rate > 1000000) return json({ error: "Montant invalide" }, 400);
    audience = "B2B";
    description = "Budget avantages entreprise";
  } else if (purpose === "GIFT") {
    planCode = String(body.plan_code || "");
    cycle = String(body.billing_cycle || "MONTHLY").toUpperCase();
    if (!["MONTHLY", "ANNUAL"].includes(cycle)) return json({ error: "Cycle invalide" }, 400);
    const { data: plan } = await admin.from("plans").select("*").eq("code", planCode).eq("active", true).eq("audience", "B2C").maybeSingle();
    if (!plan) return json({ error: "Seuls les abonnements particuliers peuvent être offerts" }, 400);
    const recipient = String(body.recipient_email || "").trim().toLowerCase();
    if (recipient && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return json({ error: "Email du destinataire invalide" }, 400);
    const priceUsd = Number(cycle === "ANNUAL" ? plan.price_annual : plan.price_monthly);
    if (priceUsd <= 0) return json({ error: "Plan gratuit : rien à offrir" }, 400);
    amount = Math.round(priceUsd * rate * 100) / 100;
    companyId = null;
    description = `Abonnement offert : ${plan.name} (${cycle === "ANNUAL" ? "annuel" : "mensuel"})`;
  } else {
    planCode = String(body.plan_code || "");
    cycle = String(body.billing_cycle || "MONTHLY").toUpperCase();
    if (!["MONTHLY", "ANNUAL"].includes(cycle)) return json({ error: "Cycle invalide" }, 400);
    const { data: plan } = await admin.from("plans").select("*").eq("code", planCode).eq("active", true).maybeSingle();
    if (!plan) return json({ error: "Plan indisponible" }, 404);
    if (plan.audience === "B2B" && (profile.role !== "HR_ADMIN" || !profile.company_id)) {
      return json({ error: "Seul un administrateur RH peut abonner son entreprise" }, 403);
    }
    if (plan.audience === "MERCHANT" && !profile.merchant_id) return json({ error: "Compte marchand requis" }, 403);
    if (plan.audience === "B2C") companyId = null;
    const priceUsd = Number(cycle === "ANNUAL" ? plan.price_annual : plan.price_monthly);
    if (priceUsd <= 0) return json({ error: "Plan gratuit : aucun paiement requis" }, 400);
    amount = Math.round(priceUsd * rate * 100) / 100;
    audience = plan.audience === "B2C" ? "B2C" : "B2B";
    description = `Abonnement ${plan.name} (${cycle === "ANNUAL" ? "annuel" : "mensuel"})`;
  }

  const psp = await PspContext.load(admin);
  let route: ReturnType<typeof routePayment>;
  try {
    route = routePayment({ audience, method, country, currency }, psp.enabled);
  } catch (e) {
    // No enabled provider supports this method: a business answer, not a crash.
    return json({ error: errorMessage(e) }, 503);
  }
  const provider = route.primary;
  const reference = genRef(provider.id);

  const { data: tx, error } = await admin
    .from("transactions")
    .insert({
      user_id: user.id,
      company_id: purpose === "RECHARGE" ? profile.company_id : companyId,
      amount,
      currency,
      amount_usd: Math.round((amount / rate) * 10000) / 10000,
      psp_reference: reference,
      payment_method: method,
      type: purpose,
      status: "PENDING",
      plan_code: planCode,
      billing_cycle: cycle,
      description,
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (purpose === "GIFT") {
    const { error: giftError } = await admin.rpc("create_pending_gift", {
      p_user: user.id,
      p_transaction_id: tx.id,
      p_plan_code: planCode,
      p_cycle: cycle,
      p_recipient_email: String(body.recipient_email || ""),
      p_recipient_name: String(body.recipient_name || ""),
      p_message: String(body.message || ""),
      p_amount_usd: Math.round((amount / rate) * 10000) / 10000,
    });
    if (giftError) {
      await admin.from("transactions").update({ status: "FAILED", admin_note: giftError.message.slice(0, 300) }).eq("id", tx.id);
      return json({ error: giftError.message }, 400);
    }
  }

  try {
    const session = await initPayment(psp, provider.id, {
      amount,
      currency,
      email: user.email || "",
      reference,
      callback_url: callbackUrl,
      metadata: { user_id: user.id, name: profile.full_name || "", purpose },
    });
    await admin.from("transactions").update({ provider_ref: session.provider_ref }).eq("id", tx.id);
    return json({
      ok: true,
      psp: provider.name,
      pspId: provider.id,
      reason: route.reason,
      reference,
      amount,
      currency,
      transactionId: tx.id,
      authorization_url: session.authorization_url,
    });
  } catch (e) {
    await admin.from("transactions").update({ status: "FAILED", admin_note: errorMessage(e).slice(0, 300) }).eq("id", tx.id);
    return json({ error: errorMessage(e), psp: provider.name }, 502);
  }
});
