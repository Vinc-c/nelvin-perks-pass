// Wallet withdrawal request toward Mobile Money / bank account.
// Funds are reserved immediately (atomic, never below zero) and the request
// appears in Admin → Paiements, where Nelvin sends the money and confirms it
// (or rejects it, which refunds the wallet).
import { adminClient, getCaller, json, MFA_REQUIRED, readJson, serve } from "../_shared/http.ts";

const VALID_METHODS = ["MOBILE_MONEY", "BANK_TRANSFER"];

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  const { profile, user } = caller;
  if (!caller.mfaOk) return json(MFA_REQUIRED, 403);

  const body = await readJson(req);
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Montant invalide" }, 400);
  const method = String(body.method || "MOBILE_MONEY").toUpperCase();
  if (!VALID_METHODS.includes(method)) return json({ error: "Méthode de retrait invalide" }, 400);
  const destination = String(body.destination || "").trim().slice(0, 120);
  if (destination.length < 6) return json({ error: "Destination requise (numéro ou IBAN)" }, 400);
  const currency = String(body.currency || profile.wallet_currency || "USD").toUpperCase().slice(0, 3);
  const reference = `NELVIN-PAYOUT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.rpc("withdraw_from_wallet", {
    p_user_id: user.id,
    p_amount: amount,
    p_currency: currency,
    p_method: method,
    p_destination: destination,
    p_reference: reference,
  });
  if (error) return json({ error: error.message }, 400);
  if (!data?.ok) return json({ error: data?.error || "Retrait impossible" }, 400);

  return json({ ok: true, status: "PENDING", balance: data.balance, amount_usd: data.amount_usd, transactionId: data.transactionId });
});
