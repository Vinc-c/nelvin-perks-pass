// Confirms a PSP payment and applies it exactly once (complete_payment is
// row-locked and idempotent): wallet recharge, company top-up or subscription.
// Called from the payment return page, or later from "Vérifier" on a pending
// transaction (owner or admin) when the user closed the tab mid-checkout.
import { adminClient, getCaller, isAdminRole, json, readJson, serve, UUID_RE } from "../_shared/http.ts";
import { PspContext, verifyPayment } from "../_shared/paymentRouter.ts";

serve(async (req) => {
  const body = await readJson(req);
  const admin = adminClient();

  let query = admin.from("transactions").select("*").in("type", ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP"]);
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
  if (tx.status === "COMPLETED") {
    return json({ ok: true, status: "already_completed", type: tx.type, transactionId: tx.id });
  }
  if (tx.status !== "PENDING") return json({ ok: false, status: tx.status, error: "Paiement non confirmé" });

  // The PSP is encoded in our own reference (NELVIN-<PSP>-…), never trusted from the URL.
  const pspId = String(tx.psp_reference || "").split("-")[1]?.toLowerCase() || "";
  const providerRef = tx.provider_ref && tx.provider_ref !== tx.psp_reference
    ? tx.provider_ref
    : body.provider_ref ? String(body.provider_ref).slice(0, 200) : null;

  const psp = await PspContext.load(admin);
  const result = await verifyPayment(psp, pspId, {
    reference: tx.psp_reference,
    providerRef,
    amount: Number(tx.amount),
    currency: tx.currency,
  });

  if (!result.ok) {
    const terminal = ["failed", "cancelled", "abandoned", "expired", "mismatch", "unpaid", "FAILED", "canceled"];
    if (terminal.includes(result.status)) {
      await admin.from("transactions").update({ status: "FAILED", admin_note: `PSP: ${result.status}` })
        .eq("id", tx.id).eq("status", "PENDING");
    }
    return json({ ok: false, status: result.status, error: "Paiement non confirmé" });
  }

  const { data, error } = await admin.rpc("complete_payment", { p_reference: tx.psp_reference });
  if (error) throw error;
  return json(data);
});
