// Starts a wallet top-up: routes to the right PSP, records a PENDING
// transaction, and returns the hosted-checkout URL.
import { adminClient, errorMessage, getCaller, json, readJson, serve } from "../_shared/http.ts";
import { initPayment, routePayment } from "../_shared/paymentRouter.ts";

const AUDIENCE_BY_ROLE: Record<string, string> = {
  MEMBER: "B2C", user: "B2C", EMPLOYEE: "B2C",
  HR_ADMIN: "B2B", MERCHANT: "B2B", SUPER_ADMIN: "B2C", admin: "B2C",
};
const VALID_METHODS = ["CARD", "MOBILE_MONEY", "BANK_TRANSFER", "APPLE_PAY", "GOOGLE_PAY"];

function genRef(pspId: string) {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `NELVIN-${pspId.toUpperCase()}-${Date.now()}-${rand}`;
}

// Only allow redirects back to our own app (configure APP_URL / ALLOWED_ORIGINS).
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
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return json({ error: "Montant invalide" }, 400);
  const method = String(body.method || "CARD").toUpperCase();
  if (!VALID_METHODS.includes(method)) return json({ error: "Méthode de paiement invalide" }, 400);
  const currency = String(body.currency || profile.wallet_currency || "USD").toUpperCase().slice(0, 8);
  const country = String(body.country || profile.country || "").slice(0, 60);
  const callbackUrl = String(body.callback_url || "").slice(0, 300);
  if (!isAllowedCallback(callbackUrl)) return json({ error: "callback_url invalide (URL de retour)" }, 400);
  const audience = AUDIENCE_BY_ROLE[profile.role] || "B2C";

  const route = routePayment({ audience, method, country, currency });
  const psp = route.primary;
  const reference = genRef(psp.id);

  const { data: tx, error } = await admin
    .from("transactions")
    .insert({
      user_id: user.id,
      company_id: profile.company_id,
      amount,
      currency,
      psp_reference: reference,
      payment_method: method,
      type: "RECHARGE",
      status: "PENDING",
      created_by_id: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  try {
    const session = await initPayment(psp.id, {
      amount,
      currency,
      email: user.email || "",
      reference,
      callback_url: callbackUrl,
      metadata: { user_id: user.id, name: profile.full_name || "" },
    });
    await admin.from("transactions").update({ provider_ref: session.provider_ref }).eq("id", tx.id);
    return json({
      ok: true,
      psp: psp.name,
      pspId: psp.id,
      reason: route.reason,
      reference,
      transactionId: tx.id,
      authorization_url: session.authorization_url,
    });
  } catch (e) {
    await admin.from("transactions").update({ status: "FAILED" }).eq("id", tx.id);
    return json({ error: errorMessage(e), psp: psp.name }, 502);
  }
});
