// Public: checks an HR invite code (+ optional work email) before signup.
// Business rejections return 200 with { valid:false, error } so the UI can show them.
import { adminClient, json, readJson, serve } from "../_shared/http.ts";

serve(async (req) => {
  const body = await readJson(req);
  const code = String(body.code || "").trim().toUpperCase().slice(0, 40);
  const email = String(body.email || "").trim().toLowerCase();
  if (!code) return json({ valid: false, error: "Invite code is required" });

  const admin = adminClient();
  // Brute-force guard: 10 lookups per 15 minutes per client IP.
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim();
  const { data: allowed } = await admin.rpc("invite_attempt_allowed", { p_ip: ip, p_limit: 10, p_window_minutes: 15 });
  if (allowed === false) return json({ valid: false, error: "Too many attempts. Please try again in a few minutes." }, 429);

  const { data: invite } = await admin.from("invite_codes").select("*").eq("code", code).maybeSingle();
  if (!invite) return json({ valid: false, error: "Invalid invite code" });
  if (invite.status !== "PENDING") return json({ valid: false, error: "This code has already been used or revoked" });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return json({ valid: false, error: "This invite code has expired" });
  }
  if (invite.target_email && email && invite.target_email.toLowerCase() !== email) {
    return json({ valid: false, error: "This invite code is not for this email address" });
  }

  return json({
    valid: true,
    code_id: invite.id,
    company_id: invite.company_id,
    role: invite.role || "EMPLOYEE",
    target_email: invite.target_email || null,
    target_name: invite.target_name || null,
  });
});
