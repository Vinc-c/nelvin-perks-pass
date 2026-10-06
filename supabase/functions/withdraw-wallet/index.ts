// Wallet withdrawal toward Mobile Money / bank. The debit is atomic and can
// never take the balance below zero (withdraw_from_wallet RPC).
//
// NOTE: the actual PSP payout API call is not wired yet (same as before the
// migration): the withdrawal is recorded and the wallet debited so the in-app
// flow works end to end. Plug the payout call in where indicated below.
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";
import { routePayment } from "../_shared/paymentRouter.ts";

const AUDIENCE_BY_ROLE: Record<string, string> = {
  MEMBER: "B2C", user: "B2C", EMPLOYEE: "B2C",
  HR_ADMIN: "B2B", MERCHANT: "B2B", SUPER_ADMIN: "B2C", admin: "B2C",
};
const VALID_METHODS = ["MOBILE_MONEY", "BANK_TRANSFER"];

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  const { profile, user } = caller;

  const body = await readJson(req);
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Montant invalide" }, 400);
  const method = String(body.method || "MOBILE_MONEY").toUpperCase();
  if (!VALID_METHODS.includes(method)) return json({ error: "Méthode de retrait invalide" }, 400);
  const destination = String(body.destination || "").trim().slice(0, 120);
  if (!destination) return json({ error: "Destination requise" }, 400);
  const currency = String(body.currency || profile.wallet_currency || "USD").toUpperCase().slice(0, 8);
  const country = String(body.country || profile.country || "").slice(0, 60);

  const route = routePayment({ audience: AUDIENCE_BY_ROLE[profile.role] || "B2C", method, country, currency });
  const psp = route.primary;
  const pspRef = `NELVIN-PAYOUT-${psp.id.toUpperCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  // --- Real PSP payout call goes here (psp.id + destination) ---

  const { data, error } = await admin.rpc("withdraw_from_wallet", {
    p_user_id: user.id,
    p_amount: amount,
    p_currency: currency,
    p_method: method,
    p_reference: pspRef,
  });
  if (error) throw error;
  if (!data?.ok) return json({ error: data?.error || "Retrait impossible" }, 400);

  return json({ ok: true, balance: data.balance, psp: psp.name, pspId: psp.id, reason: route.reason, transactionId: data.transactionId });
});
