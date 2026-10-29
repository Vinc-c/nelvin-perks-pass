// Merchant validates a member's code with the bill amount. Discount, cashback
// and the optional wallet payment are computed and applied atomically in the
// `redeem_code` SQL function (row-locked, single use).
// Business rejections return 200 { ok:false, reason } for the UI.
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
  if (!code) return json({ ok: false, reason: "INVALID", error: "Code requis" });
  const billAmount = Number(body.bill_amount);
  if (!Number.isFinite(billAmount) || billAmount <= 0) return json({ ok: false, reason: "AMOUNT_REQUIRED" });
  const billCurrency = String(body.bill_currency || "USD").toUpperCase().slice(0, 3);

  const merchantId = caller.profile.merchant_id;
  if (!merchantId) return json({ ok: false, reason: "MERCHANT_REQUIRED" });
  const { data: merchant } = await admin.from("merchants").select("verified_status").eq("id", merchantId).maybeSingle();
  if (merchant?.verified_status !== "VERIFIED") return json({ ok: false, reason: "MERCHANT_REQUIRED" });

  const { data, error } = await admin.rpc("redeem_code", {
    p_code: code,
    p_merchant_id: merchantId,
    p_bill_amount: billAmount,
    p_bill_currency: billCurrency,
    p_pay_with_wallet: body.pay_with_wallet === true,
  });
  if (error) {
    if (error.code === "22023") return json({ ok: false, reason: "CURRENCY", error: error.message });
    throw error;
  }
  if (data?.ok) {
    // Show the merchant exactly which offer was just honoured (what to hand over).
    const { data: red } = await admin.from("redemptions")
      .select("offers(title, description, discount_type, discount_value, perk_label, deal_terms, image_url)")
      .eq("code_used", code).maybeSingle();
    if (red?.offers) return json({ ...data, offer: red.offers });
  }
  return json(data);
});
