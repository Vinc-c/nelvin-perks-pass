// Admin-only: checks a PSP's stored credentials with a harmless API call and
// records the result on psp_providers (shown in Admin → PSP).
import { adminClient, errorMessage, getCaller, isAdminRole, json, MFA_REQUIRED, readJson, serve } from "../_shared/http.ts";
import { PspContext, testConnection } from "../_shared/paymentRouter.ts";

const PROVIDERS = ["stripe", "paystack", "flutterwave", "paddle", "payunit", "korapay"];

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  if (!isAdminRole(caller.profile.role)) return json({ error: "Forbidden" }, 403);
  if (!caller.mfaOk) return json(MFA_REQUIRED, 403);

  const body = await readJson(req);
  const provider = String(body.provider || "").toLowerCase();
  if (!PROVIDERS.includes(provider)) return json({ error: "PSP inconnu" }, 400);

  const { data: row } = await admin.from("psp_providers").select("live_mode").eq("id", provider).maybeSingle();
  const psp = new PspContext(admin, [{ id: provider, live_mode: row?.live_mode ?? false, public_key: null, methods: [], has_secret: true }]);

  let result: { ok: boolean; message: string };
  try {
    result = await testConnection(psp, provider);
  } catch (e) {
    result = { ok: false, message: errorMessage(e) };
  }
  await admin.from("psp_providers")
    .update({ last_test_at: new Date().toISOString(), last_test_ok: result.ok, last_test_message: result.message.slice(0, 300) })
    .eq("id", provider);
  return json(result);
});
