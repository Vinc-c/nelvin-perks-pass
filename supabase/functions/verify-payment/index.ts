// Confirms a PSP payment and applies it exactly once (complete_payment is
// row-locked and idempotent): wallet recharge, company top-up or subscription.
// Called from the payment return page, or later from "Vérifier" on a pending
// transaction (owner or admin) when the user closed the tab mid-checkout.
import { adminClient, getCaller, isAdminRole, json, readJson, serve, UUID_RE } from "../_shared/http.ts";
import { settleTransaction } from "../_shared/settle.ts";

serve(async (req) => {
  const body = await readJson(req);
  const admin = adminClient();

  let query = admin.from("transactions").select("*").in("type", ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP", "GIFT"]);
  const txId = String(body.transaction_id || "");
  if (txId) {
    if (!UUID_RE.test(txId)) return json({ ok: false, error: "Transaction introuvable" }, 404);
    const caller = await getCaller(req, admin);
    if (!caller) return json({ error: "Unauthorized" }, 401);
    query = query.eq("id", txId);
    if (!(isAdminRole(caller.profile.role) && caller.mfaOk)) query = query.eq("user_id", caller.user.id);
  } else {
    const ref = String(body.ref || "").slice(0, 120);
    if (!ref) return json({ ok: false, error: "Référence de paiement manquante" }, 400);
    query = query.eq("psp_reference", ref);
  }

  const { data: tx } = await query.maybeSingle();
  if (!tx) return json({ ok: false, error: "Transaction introuvable" }, 404);
  const result = await settleTransaction(admin, tx, body.provider_ref ? String(body.provider_ref) : null);
  return json(result);
});
