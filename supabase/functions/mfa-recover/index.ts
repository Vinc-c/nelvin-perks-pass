// Lost authenticator: a signed-in user (password step done, AAL1) enters one
// of their single-use recovery codes. The code is burnt and every TOTP factor
// of the account is removed, so the user can enroll a new authenticator.
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const code = String(body.code || "").trim();
  if (!/^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/.test(code)) return json({ error: "Format de code invalide (ex. ABCDE-FGH23)" }, 400);

  const { data: ok, error } = await admin.rpc("consume_mfa_recovery_code", { p_user_id: caller.user.id, p_code: code });
  if (error) return json({ error: error.message }, 429);
  if (!ok) return json({ error: "Code de secours invalide ou déjà utilisé" }, 400);

  const { data: factors, error: listError } = await admin.auth.admin.mfa.listFactors({ userId: caller.user.id });
  if (listError) return json({ error: listError.message }, 500);
  for (const f of factors?.factors || []) {
    const { error: delError } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: caller.user.id });
    if (delError) return json({ error: delError.message }, 500);
  }
  return json({ ok: true, removed: factors?.factors?.length || 0 });
});
