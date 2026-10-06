// Decides whether the caller may use the transactional portal pages.
// Admins and merchants always pass. HR/employees depend on their company's
// subscription (active, or within the 30-day trial). Members are only blocked
// when a membership they once had has ended.
import { adminClient, getCaller, isAdminRole, json, serve } from "../_shared/http.ts";

const TRIAL_DAYS = 30;

type Sub = { status: string; expires_at: string | null };
const isActive = (s: Sub) =>
  (s.status === "ACTIVE" || s.status === "TRIALING") && !(s.expires_at && new Date(s.expires_at) < new Date());

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  const { profile } = caller;

  if (isAdminRole(profile.role) || profile.role === "MERCHANT") return json({ allowed: true });

  if (profile.role === "HR_ADMIN" || profile.role === "EMPLOYEE") {
    if (!profile.company_id) return json({ allowed: false, reason: "no_company" });
    const { data: company } = await admin.from("companies").select("*").eq("id", profile.company_id).maybeSingle();
    if (!company) return json({ allowed: false, reason: "no_company" });
    const status = company.subscription_status;
    if (status === "ACTIVE") return json({ allowed: true, company });
    if (status === "TRIAL") {
      const days = (Date.now() - new Date(company.created_date).getTime()) / 86_400_000;
      if (days <= TRIAL_DAYS) return json({ allowed: true, company, trial: true });
      return json({ allowed: false, reason: "trial_expired", company });
    }
    return json({ allowed: false, reason: status === "CANCELLED" ? "cancelled" : "expired", company });
  }

  const { data: subs } = await admin
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", profile.id)
    .order("created_date", { ascending: false })
    .limit(50);
  if (!subs || subs.length === 0) return json({ allowed: true });
  if ((subs as Sub[]).some(isActive)) return json({ allowed: true });
  return json({ allowed: false, reason: "membership_expired" });
});
