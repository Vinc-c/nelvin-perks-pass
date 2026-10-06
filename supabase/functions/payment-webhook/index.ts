// PSP webhooks: confirm a payment even when the customer closes the page
// before returning to the site.
//
// URL to register in each PSP dashboard:
//   https://<project>.supabase.co/functions/v1/payment-webhook?psp=<stripe|paystack|flutterwave|paddle|korapay|payunit>
//
// Security: the signature is checked when the PSP signs its webhooks and the
// matching secret is configured (Admin → Clés PSP). Whatever the payload says,
// the payment is then re-verified directly with the PSP API (reference, amount,
// currency) before anything is credited, so a forged call can never credit an
// account. complete_payment is idempotent: PSP retries are harmless.
import { adminClient, json, serve } from "../_shared/http.ts";
import { PspContext } from "../_shared/paymentRouter.ts";
import { findPspTransaction, settleTransaction } from "../_shared/settle.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const enc = new TextEncoder();

async function hmacHex(algo: "SHA-256" | "SHA-512", secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: algo }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const parts = (header: string, sep: string) =>
  Object.fromEntries(header.split(sep).map((p) => p.trim().split("=")).filter((kv) => kv.length === 2));

async function secret(psp: PspContext, id: string, key: string): Promise<string> {
  const stored = await psp.secrets(id).catch(() => ({} as Record<string, string>));
  return stored[key] || Deno.env.get(key) || "";
}

/** true = valid, false = invalid, null = PSP not signing / secret not configured. */
async function checkSignature(psp: PspContext, id: string, req: Request, raw: string, payload: Any): Promise<boolean | null> {
  const h = (name: string) => req.headers.get(name) || "";
  switch (id) {
    case "stripe": {
      const s = await secret(psp, "stripe", "STRIPE_WEBHOOK_SECRET");
      if (!s) return null;
      const p = parts(h("stripe-signature"), ",");
      if (!p.t || !p.v1 || Math.abs(Date.now() / 1000 - Number(p.t)) > 300) return false;
      return safeEqual(await hmacHex("SHA-256", s, `${p.t}.${raw}`), p.v1);
    }
    case "paystack": {
      const s = await secret(psp, "paystack", "PAYSTACK_SECRET_KEY");
      if (!s) return null;
      return safeEqual(await hmacHex("SHA-512", s, raw), h("x-paystack-signature"));
    }
    case "flutterwave": {
      const s = await secret(psp, "flutterwave", "FLUTTERWAVE_WEBHOOK_HASH");
      if (!s) return null;
      return safeEqual(s, h("verif-hash"));
    }
    case "paddle": {
      const s = await secret(psp, "paddle", "PADDLE_WEBHOOK_SECRET");
      if (!s) return null;
      const p = parts(h("paddle-signature"), ";");
      if (!p.ts || !p.h1) return false;
      return safeEqual(await hmacHex("SHA-256", s, `${p.ts}:${raw}`), p.h1);
    }
    case "korapay": {
      const s = await secret(psp, "korapay", "KORAPAY_SECRET_KEY");
      if (!s) return null;
      return safeEqual(await hmacHex("SHA-256", s, JSON.stringify(payload?.data ?? {})), h("x-korapay-signature"));
    }
    default:
      return null; // Payunit: no signature; the PSP re-verification below is the control.
  }
}

/** Our reference (NELVIN-…) and the PSP's own id, from each PSP's payload. */
function extract(id: string, payload: Any, url: URL): { reference: string; providerRef: string | null } {
  const d = payload?.data ?? {};
  switch (id) {
    case "stripe": {
      const o = d.object ?? {};
      return { reference: o.client_reference_id || "", providerRef: o.object === "checkout.session" ? o.id : null };
    }
    case "paystack": return { reference: d.reference || "", providerRef: d.id ? String(d.id) : null };
    case "flutterwave": return { reference: d.tx_ref || payload?.txRef || "", providerRef: d.id ? String(d.id) : null };
    case "paddle": return { reference: d.custom_data?.nelvin_reference || "", providerRef: d.id || null };
    case "korapay": return { reference: d.reference || "", providerRef: null };
    case "payunit":
      return { reference: payload?.transaction_id || d.transaction_id || url.searchParams.get("ref") || "", providerRef: null };
    default: return { reference: "", providerRef: null };
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get("psp") || "").toLowerCase();
  if (!["stripe", "paystack", "flutterwave", "paddle", "korapay", "payunit"].includes(id)) {
    return json({ error: "Paramètre psp manquant ou inconnu" }, 400);
  }

  const raw = req.method === "POST" ? await req.text() : "";
  let payload: Any = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = Object.fromEntries(new URLSearchParams(raw));
  }

  const admin = adminClient();
  const psp = await PspContext.load(admin);
  const signature = await checkSignature(psp, id, req, raw, payload);
  if (signature === false) return json({ error: "Signature invalide" }, 401);

  const { reference, providerRef } = extract(id, payload, url);
  const tx = await findPspTransaction(admin, reference);
  // Unknown or foreign events: acknowledge so the PSP stops retrying.
  if (!tx) return json({ received: true, ignored: true });

  try {
    const result = await settleTransaction(admin, tx, providerRef, psp);
    return json({ received: true, status: result.status });
  } catch (e) {
    console.error("payment-webhook", id, reference, e);
    return json({ error: "Vérification impossible, réessayez" }, 500); // PSP will retry
  }
});
