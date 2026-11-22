// Admin-only: checks an integration's stored key with a harmless, read-only API call and records the result
// on public.integrations (shown in Admin → Integrations). Never returns or logs the key.
import { adminClient, errorMessage, getCaller, isAdminRole, json, MFA_REQUIRED, readJson, serve } from "../_shared/http.ts";

type Result = { ok: boolean; message: string };

async function test(id: string, s: Record<string, string>, cfg: Record<string, string>): Promise<Result> {
  const t = (url: string, init: RequestInit = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  if (id === "resend") {
    if (!s.RESEND_API_KEY) return { ok: false, message: "No Resend key saved" };
    const r = await t("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${s.RESEND_API_KEY}` } });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      const doms = (d.data || []) as { name: string; status: string }[];
      const verified = doms.filter((x) => x.status === "verified").map((x) => x.name);
      return verified.length
        ? { ok: true, message: `Key valid. Verified domain(s): ${verified.join(", ")}` }
        : { ok: false, message: "Key valid, but no verified sending domain yet: verify your domain in Resend before emails can be delivered." };
    }
    if (r.status === 401 && d?.name === "restricted_api_key") return { ok: true, message: "Key valid (sending-only key). Domain status cannot be checked with this key." };
    return { ok: false, message: `Resend rejected the key (${r.status})` };
  }
  if (id === "gemini") {
    if (!s.GEMINI_API_KEY) return { ok: false, message: "No Gemini key saved" };
    const r = await t("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { headers: { "x-goog-api-key": s.GEMINI_API_KEY } });
    return r.ok ? { ok: true, message: `Key valid. Model in use: ${cfg.GEMINI_MODEL || "gemini-2.5-flash"}` } : { ok: false, message: `Gemini rejected the key (${r.status})` };
  }
  if (id === "anthropic") {
    if (!s.ANTHROPIC_API_KEY) return { ok: false, message: "No Anthropic key saved" };
    const r = await t("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": s.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" } });
    return r.ok ? { ok: true, message: "Key valid" } : { ok: false, message: `Anthropic rejected the key (${r.status})` };
  }
  if (id === "twilio") {
    if (!s.TWILIO_ACCOUNT_SID || !s.TWILIO_AUTH_TOKEN) return { ok: false, message: "Account SID and auth token are both required" };
    if (!/^AC[0-9a-f]{32}$/i.test(s.TWILIO_ACCOUNT_SID)) return { ok: false, message: "Account SID format is invalid" };
    const r = await t(`https://api.twilio.com/2010-04-01/Accounts/${s.TWILIO_ACCOUNT_SID}.json`, { headers: { Authorization: "Basic " + btoa(`${s.TWILIO_ACCOUNT_SID}:${s.TWILIO_AUTH_TOKEN}`) } });
    return r.ok ? { ok: true, message: "Credentials valid" } : { ok: false, message: `Twilio rejected the credentials (${r.status})` };
  }
  return { ok: false, message: "This service has no automatic test" };
}

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  if (!isAdminRole(caller.profile.role)) return json({ error: "Forbidden" }, 403);
  if (!caller.mfaOk) return json(MFA_REQUIRED, 403);

  const id = String((await readJson(req)).id || "").toLowerCase();
  if (!["resend", "gemini", "anthropic", "twilio"].includes(id)) return json({ error: "Service inconnu" }, 400);

  const { data: rt } = await admin.rpc("get_integration_runtime", { p_id: id });
  let result: Result;
  try {
    result = await test(id, rt?.secrets || {}, rt?.config || {});
  } catch (e) {
    result = { ok: false, message: `Connection failed: ${errorMessage(e).slice(0, 120)}` };
  }
  await admin.from("integrations")
    .update({ last_test_at: new Date().toISOString(), last_test_ok: result.ok, last_test_message: result.message.slice(0, 300) })
    .eq("id", id);
  return json(result);
});
