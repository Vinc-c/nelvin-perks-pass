// Delivers queued emails (public.email_outbox) as branded HTML through Resend.
// Triggered by a database trigger (pg_net) with a shared secret header; it also
// drains older pending/failed rows, so a temporary outage self-heals.
// Secrets: RESEND_API_KEY, EMAIL_FROM (default "Nelvin <no-reply@nelvinbenefits.com>"), APP_URL.
import { adminClient, json, readJson, serve, errorMessage } from "../_shared/http.ts";
import { renderEmail, paragraph, esc, COPY, BRAND } from "../_shared/emailLayout.mjs";

type Lang = "fr" | "en" | "sw" | "ar" | "yo";
type Row = { id: string; to_email: string; template: string; lang: string; data: Record<string, string | null>; attempts: number };

type L5 = Record<Lang, string>;
const REMINDERS: Record<string, { title: L5; body: L5; cta: L5; path: string }> = {
  reminder_expiring: {
    path: "/billing-settings",
    title: { fr: "Votre Pass expire dans {n} jour(s)", en: "Your Pass expires in {n} day(s)", sw: "Pasi yako itaisha baada ya siku {n}", ar: "تنتهي بطاقتك خلال {n} يوم", yo: "Káàdì rẹ yóò parí ní ọjọ́ {n}" },
    body: {
      fr: "Votre Pass expire le {date}. Renouvelez-le pour garder vos privilèges, votre cashback et l'accès aux offres partenaires.",
      en: "Your Pass expires on {date}. Renew it to keep your perks, your cashback and access to partner offers.",
      sw: "Pasi yako inaisha tarehe {date}. Ihuishe ili kuendelea kufurahia ofa, pesa-rudishwa na ofa za washirika.",
      ar: "تنتهي بطاقتك في {date}. جدّدها لتحتفظ بمزاياك والاسترداد النقدي وعروض الشركاء.",
      yo: "Káàdì rẹ yóò parí ní {date}. Tún un ṣe kí o lè máa gbádùn àwọn àǹfààní rẹ, owó padà àti àwọn ìpèsè alábàáṣiṣẹ́pọ̀.",
    },
    cta: { fr: "Renouveler mon Pass", en: "Renew my Pass", sw: "Huisha Pasi yangu", ar: "جدّد بطاقتي", yo: "Tún Káàdì mi ṣe" },
  },
  reminder_inactive: {
    path: "/app",
    title: { fr: "Vos privilèges vous attendent", en: "Your perks are waiting", sw: "Ofa zako zinakusubiri", ar: "مزاياك بانتظارك", yo: "Àwọn àǹfààní rẹ ń dúró dè ọ́" },
    body: {
      fr: "Cela fait un moment que vous n'avez pas utilisé votre Pass. De nouvelles offres de nos partenaires vous attendent près de chez vous.",
      en: "It's been a while since you used your Pass. New offers from our partners are waiting near you.",
      sw: "Imepita muda tangu utumie Pasi yako. Ofa mpya kutoka kwa washirika wetu zinakusubiri karibu nawe.",
      ar: "مرّ وقت منذ استخدمت بطاقتك. عروض جديدة من شركائنا بانتظارك بالقرب منك.",
      yo: "Ó ti pẹ́ tí o ti lo Káàdì rẹ. Àwọn ìpèsè tuntun láti ọ̀dọ̀ àwọn alábàáṣiṣẹ́pọ̀ wa wà nítòsí rẹ.",
    },
    cta: { fr: "Voir les offres", en: "See the offers", sw: "Tazama ofa", ar: "عرض العروض", yo: "Wo àwọn ìpèsè" },
  },
  reminder_onboarding: {
    path: "/app",
    title: { fr: "Terminez la création de votre compte", en: "Finish setting up your account", sw: "Kamilisha akaunti yako", ar: "أكمل إعداد حسابك", yo: "Parí ṣíṣe àkọọ́lẹ̀ rẹ" },
    body: {
      fr: "Il ne vous reste que quelques secondes pour activer votre compte Nelvin et découvrir les offres premium.",
      en: "Just a few seconds left to activate your Nelvin account and discover premium perks.",
      sw: "Imebaki sekunde chache kuwasha akaunti yako ya Nelvin na kugundua ofa za hali ya juu.",
      ar: "بقيت ثوانٍ قليلة لتفعيل حسابك في نيلفين واكتشاف العروض المميزة.",
      yo: "Ìṣẹ́jú àáyá díẹ̀ ló kù kí o mú àkọọ́lẹ̀ Nelvin rẹ ṣiṣẹ́ kí o sì ṣàwárí àwọn ìpèsè.",
    },
    cta: { fr: "Continuer", en: "Continue", sw: "Endelea", ar: "متابعة", yo: "Tẹ̀síwájú" },
  },
};

const COLS = "id,to_email,template,lang,data,attempts";

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
  if (row.template.startsWith("reminder_")) {
    const r = REMINDERS[row.template] || REMINDERS.reminder_inactive;
    const first = d.name ? ` ${esc(String(d.name).split(" ")[0])}` : "";
    const title = r.title[lang].replace("{n}", String(d.days ?? ""));
    const text = r.body[lang].replace("{n}", String(d.days ?? "")).replace("{date}", String(d.date ?? ""));
    return {
      subject: title,
      html: renderEmail({
        lang, siteUrl: BRAND.site, title, preheader: text,
        bodyHtml: paragraph(`${COPY.hello[lang]}${first},`) + paragraph(esc(text)),
        cta: { label: r.cta[lang], url: `${appUrl}${r.path}` },
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
  // The shared secret lives only in Vault; the database compares it (email_hook_ok).
  const admin = adminClient();
  const { data: ok } = await admin.rpc("email_hook_ok", { p_secret: req.headers.get("x-email-secret") || "" });
  if (ok !== true) return json({ error: "Unauthorized" }, 401);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return json({ ok: true, skipped: "RESEND_API_KEY not configured: emails stay queued" });

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
