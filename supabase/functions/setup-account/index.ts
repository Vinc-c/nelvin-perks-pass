// First-time onboarding: sets the role from the chosen account type and, for
// companies, creates the tenant (30-day trial).
import { adminClient, getCaller, json, readJson, serve } from "../_shared/http.ts";

const ROLE_BY_TYPE: Record<string, string> = { particulier: "MEMBER", marchand: "MERCHANT", entreprise: "HR_ADMIN" };
const HOME: Record<string, string> = {
  MEMBER: "/member", user: "/member", MERCHANT: "/merchant-dashboard", HR_ADMIN: "/hr",
  EMPLOYEE: "/employee", SUPER_ADMIN: "/admin", admin: "/admin",
};
const LOCKED_ROLES = ["SUPER_ADMIN", "admin", "EMPLOYEE", "HR_ADMIN", "MERCHANT"];

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  const { profile, user } = caller;

  if (profile.onboarded || LOCKED_ROLES.includes(profile.role)) {
    // Invited employees / HR still need the onboarded flag set once.
    if (!profile.onboarded) await admin.from("profiles").update({ onboarded: true }).eq("id", user.id);
    return json({ ok: true, role: profile.role, home: HOME[profile.role] || "/member" });
  }

  const body = await readJson(req);
  const type = String(body.account_type || "");
  const role = ROLE_BY_TYPE[type];
  if (!role) return json({ error: "Type de compte invalide." }, 400);
  if (role === "MERCHANT") {
    return json({ error: "Les marchands s'inscrivent via la candidature partenaire." }, 400);
  }

  const updates: Record<string, unknown> = { role, account_type: type, onboarded: true };
  const phone = String(body.phone || "").trim().slice(0, 30);
  if (phone) updates.phone = phone;

  if (role === "HR_ADMIN") {
    const name = String(body.company_name || "").trim();
    if (!name) return json({ error: "Le nom de l'entreprise est obligatoire." }, 400);
    if (name.length > 120) return json({ error: "Le nom de l'entreprise est trop long (120 caractères max)." }, 400);
    const country = String(body.country || "").trim().slice(0, 60);
    const { data: starter } = await admin.from("plans").select("max_employees").eq("code", "STARTER").maybeSingle();
    const { data: company, error } = await admin
      .from("companies")
      .insert({
        name,
        country,
        contact_email: user.email,
        plan_tier: "STARTER",
        max_employees: starter?.max_employees ?? 15,
        subscription_status: "TRIAL",
        seats_used: 1,
        created_by_id: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    updates.company_id = company.id;
    if (country) updates.country = country;
  }

  const { error } = await admin.from("profiles").update(updates).eq("id", user.id);
  if (error) throw error;
  return json({ ok: true, role, home: HOME[role] });
});
