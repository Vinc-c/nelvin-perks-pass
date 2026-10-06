// Portal access rules, shared by check-access (UI gate) and the transactional
// functions (server-side enforcement).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isAdminRole, type Profile } from "./http.ts";

type Sub = { status: string; expires_at: string | null };
const isActive = (s: Sub) =>
  (s.status === "ACTIVE" || s.status === "TRIALING") && !(s.expires_at && new Date(s.expires_at) < new Date());

export type Access = { allowed: boolean; reason?: string; company?: Record<string, unknown>; trial?: boolean; trial_days_left?: number };

export async function accessFor(admin: SupabaseClient, profile: Profile): Promise<Access> {
  if (isAdminRole(profile.role) || profile.role === "MERCHANT") return { allowed: true };

  if (profile.role === "HR_ADMIN" || profile.role === "EMPLOYEE") {
    if (!profile.company_id) return { allowed: false, reason: "no_company" };
    const { data: company } = await admin.from("companies").select("*").eq("id", profile.company_id).maybeSingle();
    if (!company) return { allowed: false, reason: "no_company" };
    const status = company.subscription_status;
    if (status === "ACTIVE") {
      // ACTIVE must be backed by a paid period that has not ended.
      const { data: subs } = await admin
        .from("subscriptions")
        .select("status, expires_at")
        .eq("company_id", company.id)
        .order("created_date", { ascending: false })
        .limit(20);
      if (!subs || subs.length === 0 || (subs as Sub[]).some(isActive)) return { allowed: true, company };
      await admin.from("companies").update({ subscription_status: "PAST_DUE" }).eq("id", company.id);
      return { allowed: false, reason: "expired", company: { ...company, subscription_status: "PAST_DUE" } };
    }
    if (status === "TRIAL") {
      const { data: setting } = await admin.from("platform_settings").select("value").eq("key", "trial_days").maybeSingle();
      const trialDays = Number(setting?.value) || 30;
      const days = (Date.now() - new Date(company.created_date).getTime()) / 86_400_000;
      if (days <= trialDays) {
        return { allowed: true, company, trial: true, trial_days_left: Math.max(0, Math.ceil(trialDays - days)) };
      }
      return { allowed: false, reason: "trial_expired", company };
    }
    return { allowed: false, reason: status === "CANCELLED" ? "cancelled" : "expired", company };
  }

  // Members: free tier unless a membership they had has ended.
  const { data: subs } = await admin
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", profile.id)
    .is("company_id", null)
    .order("created_date", { ascending: false })
    .limit(50);
  if (!subs || subs.length === 0) return { allowed: true };
  if ((subs as Sub[]).some(isActive)) return { allowed: true };
  return { allowed: false, reason: "membership_expired" };
}
