// Sends a Web Push for one in-app notification (public.notifications).
// Called by the notification_push database trigger with the same shared secret as send-email.
// The VAPID private key lives only in Vault (read through push_private_key(), service role only).
import webpush from "npm:web-push@3.6.7";
import { adminClient, json, readJson, serve, errorMessage } from "../_shared/http.ts";

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = adminClient();
  const { data: ok } = await admin.rpc("email_hook_ok", { p_secret: req.headers.get("x-email-secret") || "" });
  if (ok !== true) return json({ error: "Unauthorized" }, 401);

  const body = await readJson(req);
  const id = typeof body.notification_id === "string" ? body.notification_id : "";
  if (!id) return json({ error: "notification_id required" }, 400);

  const { data: n } = await admin.from("notifications").select("id,user_id,type,title,body,link").eq("id", id).maybeSingle();
  if (!n) return json({ ok: true, skipped: "notification not found" });

  const { data: p } = await admin.from("profiles").select("notif_push,notif_prefs").eq("id", n.user_id).maybeSingle();
  if (p?.notif_push === false) return json({ ok: true, skipped: "push disabled by user" });
  const prefs = (p?.notif_prefs || {}) as Record<string, boolean>;
  if (n.type !== "ALERT" && prefs[n.type] === false) return json({ ok: true, skipped: "category disabled by user" });

  const { data: subs } = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", n.user_id);
  if (!subs?.length) return json({ ok: true, skipped: "no subscription" });

  const { data: pub } = await admin.from("platform_settings").select("value").eq("key", "vapid_public_key").maybeSingle();
  const { data: priv } = await admin.rpc("push_private_key");
  if (!pub?.value || !priv) return json({ ok: true, skipped: "VAPID keys not configured" });
  webpush.setVapidDetails("mailto:support@nelvinbenefits.com", String(pub.value), String(priv));

  const link = typeof n.link === "string" && n.link.startsWith("/") ? n.link : "/app";
  const payload = JSON.stringify({ title: String(n.title).slice(0, 80), body: String(n.body || "").slice(0, 180), url: link, tag: n.type });
  let sent = 0, removed = 0, failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "normal" });
      sent++;
      await admin.from("push_subscriptions").update({ last_ok_date: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await admin.from("push_subscriptions").delete().eq("id", s.id); removed++; }
      else { failed++; console.error("push failed", code, errorMessage(e).slice(0, 120)); }
    }
  }
  return json({ ok: true, sent, removed, failed });
});
