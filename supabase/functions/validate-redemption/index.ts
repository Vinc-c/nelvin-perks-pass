// Merchant validates a code presented by a member. All money movement happens
// atomically in the `redeem_code` SQL function (row-locked, idempotent).
// Business rejections return 200 { ok:false, reason } for the UI.
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
  if (!code) return json({ ok: false, reason: "INVALID", error: "Code requis" });

  const merchantId = caller.profile.merchant_id;
  if (!merchantId) return json({ ok: false, reason: "MERCHANT_REQUIRED" });

  const { data: merchant } = await admin.from("merchants").select("verified_status").eq("id", merchantId).maybeSingle();
  if (merchant?.verified_status !== "VERIFIED") return json({ ok: false, reason: "MERCHANT_REQUIRED" });

  const { data, error } = await admin.rpc("redeem_code", { p_code: code, p_merchant_id: merchantId });
  if (error) throw error;
  return json(data);
});
