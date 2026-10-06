// Admin-only: sends a Supabase Auth invitation email to someone who has no
// account yet.
import { adminClient, getCaller, isAdminRole, json, readJson, serve } from "../_shared/http.ts";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  if (!isAdminRole(caller.profile.role)) return json({ error: "Forbidden" }, 403);

  const body = await readJson(req);
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Email invalide" }, 400);
  const redirectTo = typeof body.redirect_to === "string" ? body.redirect_to : Deno.env.get("APP_URL") || undefined;

  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
});
