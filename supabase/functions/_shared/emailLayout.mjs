// Nelvin brand email layout — plain ESM so Deno (Edge Functions) and Node
// (scripts/build-email-templates.mjs) share one source of truth.
// Table-based + inline CSS: renders in Gmail, Outlook, Yahoo and the lightweight
// mail apps common on entry-level Android phones. No web fonts, no JS.

export const BRAND = {
  deep: "#08261D", emerald: "#0F4A38", gold: "#C8A24A", goldLight: "#E6CF8B",
  ivory: "#FAF6EC", ivory2: "#F2EBDA", line: "#E4DAC3", ink: "#14201B", muted: "#55625B",
  site: "https://nelvinbenefits.com",
};

const FOOT = {
  fr: { tag: "Le pass d'avantages premium pour l'Afrique", why: "Vous recevez cet email car vous avez un compte Nelvin.", manage: "Gérer mes notifications", help: "Besoin d'aide ?", rights: "Tous droits réservés." },
  en: { tag: "The premium perks pass for Africa", why: "You are receiving this email because you have a Nelvin account.", manage: "Manage my notifications", help: "Need help?", rights: "All rights reserved." },
  sw: { tag: "Pasi ya faida za hali ya juu kwa Afrika", why: "Unapokea barua pepe hii kwa sababu una akaunti ya Nelvin.", manage: "Simamia arifa zangu", help: "Unahitaji msaada?", rights: "Haki zote zimehifadhiwa." },
  ar: { tag: "بطاقة المزايا الفاخرة لأفريقيا", why: "تتلقى هذه الرسالة لأن لديك حساباً في نيلفين.", manage: "إدارة الإشعارات", help: "تحتاج مساعدة؟", rights: "جميع الحقوق محفوظة." },
  yo: { tag: "Káàdì àǹfààní olówó iyebíye fún Áfíríkà", why: "O ń gba ímeèlì yìí nítorí pé o ní àkọọ́lẹ̀ Nelvin.", manage: "Ṣàkóso àwọn ìkìlọ̀ mi", help: "Ṣé o nílò ìrànlọ́wọ́?", rights: "Gbogbo ẹ̀tọ́ wà ní ìpamọ́." },
};

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Gold button, "bulletproof" (works in Outlook thanks to the padded td). */
export function button(label, url, rtl = false) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr><td align="center" bgcolor="${BRAND.gold}" style="border-radius:12px"><a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font:700 15px/1.2 Arial,Helvetica,sans-serif;color:${BRAND.deep};text-decoration:none;border-radius:12px">${esc(label)}</a></td></tr></table>`;
}

/** Big one-time code block (OTP). */
export function codeBlock(code) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto"><tr><td align="center" style="background:${BRAND.ivory2};border:1px dashed ${BRAND.gold};border-radius:12px;padding:14px 26px;font:700 30px/1 'Courier New',monospace;letter-spacing:8px;color:${BRAND.deep}">${code}</td></tr></table>`;
}

export function paragraph(html) {
  return `<p style="margin:0 0 14px;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${html}</p>`;
}

/**
 * @param {{lang?:string, preheader?:string, title:string, bodyHtml:string, cta?:{label:string,url:string}, siteUrl?:string, footer?:boolean}} o
 */
export function renderEmail(o) {
  const lang = FOOT[o.lang] ? o.lang : "fr";
  const f = FOOT[lang];
  const rtl = lang === "ar";
  const site = o.siteUrl || BRAND.site;
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.ivory};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BRAND.ivory}">${esc(o.preheader || o.title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.ivory}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">
  <tr><td align="center" style="background:${BRAND.deep};border-radius:18px 18px 0 0;padding:26px 24px 22px">
    <img src="${site}/images/nelvin-icon-192.png" width="56" height="56" alt="Nelvin" style="display:block;border:0;border-radius:14px;margin:0 auto 10px">
    <div style="font:700 20px/1 Georgia,'Times New Roman',serif;letter-spacing:3px;color:${BRAND.goldLight}">NELVIN</div>
    <div style="font:400 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.gold};margin-top:6px">${esc(f.tag)}</div>
  </td></tr>
  <tr><td style="height:4px;background:${BRAND.gold};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="background:#FFFFFF;border-left:1px solid ${BRAND.line};border-right:1px solid ${BRAND.line};padding:34px 32px 26px;text-align:${rtl ? "right" : "left"}">
    <h1 style="margin:0 0 16px;font:700 24px/1.25 Georgia,'Times New Roman',serif;color:${BRAND.deep}">${esc(o.title)}</h1>
    ${o.bodyHtml}
    ${o.cta ? button(o.cta.label, o.cta.url, rtl) : ""}
  </td></tr>
  <tr><td style="background:${BRAND.ivory2};border:1px solid ${BRAND.line};border-top:0;border-radius:0 0 18px 18px;padding:20px 32px;text-align:center">
    ${o.footer === false ? "" : `<p style="margin:0 0 8px;font:400 12px/1.6 Arial,sans-serif;color:${BRAND.muted}">${esc(f.why)} <a href="${site}/settings" style="color:${BRAND.emerald}">${esc(f.manage)}</a></p>`}
    <p style="margin:0;font:400 12px/1.6 Arial,sans-serif;color:${BRAND.muted}">${esc(f.help)} <a href="mailto:support@nelvinbenefits.com" style="color:${BRAND.emerald}">support@nelvinbenefits.com</a><br>© ${year} Nelvin · nelvinbenefits.com · ${esc(f.rights)}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// Short localized strings shared by transactional emails.
export const COPY = {
  open: { fr: "Ouvrir Nelvin", en: "Open Nelvin", sw: "Fungua Nelvin", ar: "افتح نيلفين", yo: "Ṣí Nelvin" },
  hello: { fr: "Bonjour", en: "Hello", sw: "Habari", ar: "مرحباً", yo: "Báwo ni" },
  welcomeTitle: { fr: "Bienvenue chez Nelvin", en: "Welcome to Nelvin", sw: "Karibu Nelvin", ar: "مرحباً بك في نيلفين", yo: "Káàbọ̀ sí Nelvin" },
  welcomeBody: {
    fr: "Votre pass est prêt. Découvrez les offres premium de nos partenaires près de chez vous : restaurants, bien-être, voyages, shopping et plus encore.",
    en: "Your pass is ready. Discover premium perks from our partners near you: dining, wellness, travel, shopping and more.",
    sw: "Pasi yako iko tayari. Gundua ofa za hali ya juu kutoka kwa washirika wetu karibu nawe: chakula, afya, safari, ununuzi na zaidi.",
    ar: "بطاقتك جاهزة. اكتشف عروضاً مميزة من شركائنا بالقرب منك: مطاعم وعافية وسفر وتسوق وأكثر.",
    yo: "Káàdì rẹ ti ṣetán. Ṣàwárí àwọn ìpèsè olówó iyebíye látọ̀dọ̀ àwọn alábàáṣiṣẹ́pọ̀ wa nítòsí rẹ: oúnjẹ, ìlera, ìrìn àjò, ríra nǹkan àti bẹ́ẹ̀ bẹ́ẹ̀ lọ.",
  },
};
