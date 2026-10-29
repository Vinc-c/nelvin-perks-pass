// Detects VPN / proxy / Tor use for the signed-in member from the request IP
// and records the verdict in public.network_checks. Money-moving inserts
// (payments, withdrawals) are refused by a database trigger while a VPN was
// seen in the last hour. Fail-open: if the reputation service is unreachable
// the member is treated as clean (we never lock honest users out on an outage).
import { adminClient, getCaller, json, serve } from "../_shared/http.ts";

function clientIp(req: Request): string {
  const h = req.headers;
  const raw = h.get("cf-connecting-ip") || h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0] || "";
  return raw.trim().slice(0, 64);
}

async function lookup(ip: string): Promise<{ vpn: boolean; unknown: boolean }> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`, { signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) return { vpn: false, unknown: true };
    const d = await res.json();
    return { vpn: d.is_vpn === true || d.is_proxy === true || d.is_tor === true, unknown: false };
  } catch {
    return { vpn: false, unknown: true };
  }
}

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);

  const ip = clientIp(req);
  if (!ip) return json({ vpn: false, unknown: true });

  // 6-hour cache per IP keeps us far below the free quota.
  const { data: cached } = await admin.from("ip_reputation").select("is_vpn, checked_at").eq("ip", ip).maybeSingle();
  let vpn: boolean;
  let unknown = false;
  if (cached && Date.now() - new Date(cached.checked_at).getTime() < 6 * 3600 * 1000) {
    vpn = cached.is_vpn === true;
  } else {
    const r = await lookup(ip);
    vpn = r.vpn;
    unknown = r.unknown;
    if (!unknown) await admin.from("ip_reputation").upsert({ ip, is_vpn: vpn, checked_at: new Date().toISOString() });
  }
  await admin.from("network_checks").upsert({ user_id: caller.user.id, ip, is_vpn: vpn, checked_at: new Date().toISOString() });
  return json({ vpn, unknown });
});
