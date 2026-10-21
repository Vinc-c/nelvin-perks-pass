// Delivers queued emails (public.email_outbox) as branded HTML through Resend.
// Triggered by a database trigger (pg_net) with a shared secret header; it also
// drains older pending/failed rows, so a temporary outage self-heals.
// Secrets: EMAIL_HOOK_SECRET (same value as Vault 'email_hook_secret'),
//          RESEND_API_KEY, EMAIL_FROM (default "Nelvin <no-reply@nelvinbenefits.com>"), APP_URL.
import { adminClient, json, readJson, serve, errorMessage } from "../_shared/http.ts";
import { renderEmail, paragraph, esc, COPY, BRAND } from "../_shared/emailLayout.mjs";

type Lang = "fr" | "en" | "sw" | "ar" | "yo";
type Row = { id: string; to_email: string; template: string; lang: string; data: Record<string, string | null>; attempts: number };

const COLS = "id,to_email,template,lang,data,attempts";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function build(row: Row, appUrl: string): { subject: string; html: string } {
  const lang: Lang = row.lang in COPY.open ? (row.lang as Lang) : "fr";
  const d = row.data || {};
  if (row.template === "welcome") {
    const first = d.name ? ` ${esc(String(d.name).split(" ")[0])}` : "";
    return {
      subject: COPY.welcomeTitle[lang],
      html: renderEmail({
        lang, siteUrl: BRAND.site, title: COPY.welcomeTitle[lang], preheader: COPY.welcomeBody[lang],
        bodyHtml: paragraph(`${COPY.hello[lang]}${first},`) + paragraph(esc(COPY.welcomeBody[lang])),
        cta: { label: COPY.open[lang], url: `${appUrl}/app` },
      }),
    };
  }
  // generic in-app notification
  const raw = d.link ? String(d.link) : "";
  const link = !raw ? `${appUrl}/app` : raw.startsWith("http") ? raw : `${appUrl}${raw.startsWith("/") ? "" : "/"}${raw}`;
  const title = String(d.title || "Nelvin");
  return {
    subject: title,
    html: renderEmail({
      lang, siteUrl: BRAND.site, title, preheader: String(d.body || title).slice(0, 110),
      bodyHtml: paragraph(esc(String(d.body || "")).replace(/\n/g, "<br>")),
      cta: { label: COPY.open[lang], url: link },
    }),
  };
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("EMAIL_HOOK_SECRET") || "";
  if (!secret || !timingSafeEqual(req.headers.get("x-email-secret") || "", secret)) return json({ error: "Unauthorized" }, 401);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ ok: true, skipped: "RESEND_API_KEY not configured: emails stay queued" });

  const admin = adminClient();
  const from = Deno.env.get("EMAIL_FROM") || "Nelvin <no-reply@nelvinbenefits.com>";
  const appUrl = (Deno.env.get("APP_URL") || BRAND.site).replace(/\/$/, "");
  const body = await readJson(req);

  const base = admin.from("email_outbox").select(COLS).in("status", ["pending", "failed"]);
  const { data: rows, error } = typeof body.id === "string"
    ? await base.eq("id", body.id).limit(1)
    : await base.lt("attempts", 5).order("created_date").limit(25);
  if (error) return json({ error: error.message }, 500);

  let sent = 0, failed = 0;
  for (const row of (rows || []) as Row[]) {
    // claim the row so concurrent invocations never double-send
    const { data: claimed } = await admin.from("email_outbox")
      .update({ status: "sending", attempts: row.attempts + 1 })
      .eq("id", row.id).in("status", ["pending", "failed"]).select("id");
    if (!claimed?.length) continue;
    try {
      const { subject, html } = build(row, appUrl);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [row.to_email], subject, html }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
      await admin.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", row.id);
      sent++;
    } catch (e) {
      await admin.from("email_outbox").update({ status: "failed", last_error: errorMessage(e).slice(0, 500) }).eq("id", row.id);
      failed++;
    }
  }
  return json({ ok: true, sent, failed });
});
