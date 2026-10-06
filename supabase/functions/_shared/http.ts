// Shared helpers for Nelvin Edge Functions: CORS, JSON responses, auth.
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

/** Service-role client: bypasses RLS. Only use after authorizing the caller. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  onboarded: boolean;
  company_id: string | null;
  merchant_id: string | null;
  wallet_balance: number;
  wallet_currency: string;
  country: string | null;
  phone: string | null;
  [key: string]: unknown;
};

export type Caller = { user: User; profile: Profile; aal: string; mfaOk: boolean };

function jwtClaims(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part + "=".repeat((4 - (part.length % 4)) % 4)));
  } catch {
    return {};
  }
}

/**
 * Resolves the signed-in caller from the Authorization header.
 * Returns null for anonymous requests or invalid/expired tokens.
 */
export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await admin.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  if (!profile) return null;
  // 2FA: a user with a verified TOTP factor must use an AAL2 session for
  // sensitive actions (withdrawals, admin operations).
  const aal = String(jwtClaims(token).aal || "aal1");
  const hasFactor = (data.user.factors || []).some((f) => f.status === "verified");
  return { user: data.user, profile: profile as Profile, aal, mfaOk: aal === "aal2" || !hasFactor };
}

/** Wraps a handler with CORS preflight + error handling. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    try {
      return await handler(req);
    } catch (e) {
      console.error(e);
      return json({ error: errorMessage(e) }, 500);
    }
  });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const ADMIN_ROLES = ["SUPER_ADMIN", "admin"];
export const isAdminRole = (role?: string | null) => !!role && ADMIN_ROLES.includes(role);

/** Admin role AND a 2FA-satisfied session (mirrors public.is_admin()). */
export const isAdmin = (caller: Caller | null) => !!caller && isAdminRole(caller.profile.role) && caller.mfaOk;

export const MFA_REQUIRED = { error: "Validation à deux facteurs requise pour cette action.", code: "mfa_required" };

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
