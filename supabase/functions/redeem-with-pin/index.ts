// PIN redemption (no merchant login at the till): the member enters the bill
// amount, then the partner types their PIN on the member's phone. Same rules
// as a scanned code: access, verified partner, expiry, audience, usage limit,
// discount and cashback computed server-side (redeem_offer_with_pin).
// Business rejections return 200 { ok:false, reason } for the UI.
import { adminClient, getCaller, json, readJson, serve, UUID_RE } from "../_shared/http.ts";
import { accessFor } from "../_shared/access.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const access = await accessFor(admin, caller.profile);
  if (!access.allowed) return json({ ok: false, reason: "ACCESS", error: "Votre accès aux offres a expiré : renouvelez votre abonnement." });

  const body = await readJson(req);
  const offerId = String(body.offer_id || "");
  if (!UUID_RE.test(offerId)) return json({ ok: false, reason: "INVALID" });
  const pin = String(body.pin || "").trim();
  if (!/^[0-9]{4,6}$/.test(pin)) return json({ ok: false, reason: "BAD_PIN" });
  const billAmount = Number(body.bill_amount);
  if (!Number.isFinite(billAmount) || billAmount <= 0) return json({ ok: false, reason: "AMOUNT_REQUIRED" });
  const billCurrency = String(body.bill_currency || "USD").toUpperCase().slice(0, 3);

  const { data: offer } = await admin
    .from("offers")
    .select("id, expires_at, target_audience, merchants!inner(verified_status)")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) return json({ ok: false, reason: "INVALID" });
  // deno-lint-ignore no-explicit-any
  if ((offer as any).merchants?.verified_status !== "VERIFIED") return json({ ok: false, reason: "MERCHANT_INACTIVE" });
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return json({ ok: false, reason: "EXPIRED" });
  if (offer.target_audience === "B2B_ONLY" && !caller.profile.company_id) return json({ ok: false, reason: "B2B_ONLY" });

  const { data, error } = await admin.rpc("redeem_offer_with_pin", {
    p_user_id: caller.user.id,
    p_offer_id: offerId,
    p_pin: pin,
    p_bill_amount: billAmount,
    p_bill_currency: billCurrency,
    p_pay_with_wallet: body.pay_with_wallet === true,
  });
  if (error) {
    if (error.code === "22023") return json({ ok: false, reason: "CURRENCY", error: error.message });
    throw error;
  }
  return json(data);
});
