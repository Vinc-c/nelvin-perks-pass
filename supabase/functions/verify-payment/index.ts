// Confirms a recharge with the PSP after the user is redirected back, then
// credits the wallet exactly once (complete_recharge is row-locked/idempotent).
import { adminClient, json, readJson, serve } from "../_shared/http.ts";
import { verifyPayment } from "../_shared/paymentRouter.ts";

serve(async (req) => {
  const body = await readJson(req);
  const psp = String(body.psp || "").toLowerCase();
  const ref = String(body.ref || "").slice(0, 120);
  if (!psp || !ref) return json({ ok: false, error: "psp et ref requis" }, 400);

  const admin = adminClient();
  const { data: tx } = await admin
    .from("transactions")
    .select("*")
    .eq("psp_reference", ref)
    .eq("type", "RECHARGE")
    .maybeSingle();
  if (!tx) return json({ ok: false, error: "Transaction introuvable" }, 404);
  if (tx.status === "COMPLETED") {
    return json({ ok: true, status: "already_completed", transactionId: tx.id, amount: tx.amount, currency: tx.currency });
  }
  if (tx.status !== "PENDING") return json({ ok: false, status: tx.status, error: "Paiement non confirmé" });

  // The PSP-side id comes from our own record; the URL value is only a
  // fallback for PSPs where we could not store it at checkout time.
  const providerRef = tx.provider_ref && tx.provider_ref !== ref
    ? tx.provider_ref
    : body.provider_ref ? String(body.provider_ref).slice(0, 200) : null;

  const result = await verifyPayment(psp, {
    reference: ref,
    providerRef,
    amount: Number(tx.amount),
    currency: tx.currency,
  });

  if (!result.ok) {
    // Leave "pending"/"processing" states retryable; mark definitive failures.
    const terminal = ["failed", "cancelled", "abandoned", "expired", "mismatch", "unpaid", "FAILED"];
    if (terminal.includes(result.status)) {
      await admin.from("transactions").update({ status: "FAILED" }).eq("id", tx.id).eq("status", "PENDING");
    }
    return json({ ok: false, status: result.status, error: "Paiement non confirmé" });
  }

  const { data, error } = await admin.rpc("complete_recharge", { p_reference: ref });
  if (error) throw error;
  return json(data);
});
