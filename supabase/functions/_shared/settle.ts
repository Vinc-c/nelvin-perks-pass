// Confirms a pending PSP transaction with the PSP itself (reference + amount +
// currency) and applies it exactly once through complete_payment (row-locked,
// idempotent). Shared by verify-payment (return page) and payment-webhook.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { PspContext, verifyPayment } from "./paymentRouter.ts";

// deno-lint-ignore no-explicit-any
type Tx = Record<string, any>;
export type SettleResult = { ok: boolean; status: string; error?: string; [key: string]: unknown };

// Only definitive outcomes close a transaction. "failed"/"abandoned"/"unpaid"/"cancelled" are
// NOT terminal: PSPs let the customer retry on the same reference, and a later successful
// payment must still be credited. Stale PENDING rows are expired by a scheduled job instead.
const TERMINAL = ["expired", "mismatch"];

export async function settleTransaction(
  admin: SupabaseClient,
  tx: Tx,
  providerRefHint: string | null = null,
  psp?: PspContext,
): Promise<SettleResult> {
  if (tx.status === "COMPLETED") return { ok: true, status: "already_completed", type: tx.type, transactionId: tx.id };
  if (tx.status !== "PENDING") return { ok: false, status: tx.status, error: "Paiement non confirmé" };

  // The PSP is encoded in our own reference (NELVIN-<PSP>-…), never trusted from the request.
  const pspId = String(tx.psp_reference || "").split("-")[1]?.toLowerCase() || "";
  const providerRef = tx.provider_ref && tx.provider_ref !== tx.psp_reference
    ? tx.provider_ref
    : providerRefHint ? String(providerRefHint).slice(0, 200) : null;

  const ctx = psp || (await PspContext.load(admin));
  const result = await verifyPayment(ctx, pspId, {
    reference: tx.psp_reference,
    providerRef,
    amount: Number(tx.amount),
    currency: tx.currency,
  });

  if (!result.ok) {
    if (TERMINAL.includes(String(result.status).toLowerCase())) {
      await admin.from("transactions").update({ status: "FAILED", admin_note: `PSP: ${result.status}` })
        .eq("id", tx.id).eq("status", "PENDING");
    }
    return { ok: false, status: result.status, error: "Paiement non confirmé" };
  }

  const { data, error } = await admin.rpc("complete_payment", { p_reference: tx.psp_reference });
  if (error) throw error;
  return { status: "completed", ...(data as Record<string, unknown>), ok: true };
}

export async function findPspTransaction(admin: SupabaseClient, reference: string): Promise<Tx | null> {
  if (!reference || !reference.startsWith("NELVIN-")) return null;
  const { data } = await admin.from("transactions").select("*")
    .in("type", ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP", "GIFT"])
    .eq("psp_reference", reference.slice(0, 120))
    .maybeSingle();
  return data;
}
