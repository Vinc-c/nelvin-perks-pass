// Generates the Supabase Auth email templates (supabase/templates/*.html) from
// the shared brand layout. Run: node scripts/build-email-templates.mjs
// Templates are bilingual (FR first, EN below) because Auth emails use one
// template for all users. Paste them in Dashboard > Authentication > Emails.
import { writeFileSync, mkdirSync } from "node:fs";
import { renderEmail, paragraph, button, codeBlock, esc, BRAND } from "../supabase/functions/_shared/emailLayout.mjs";

const dir = new URL("../supabase/templates/", import.meta.url);
mkdirSync(dir, { recursive: true });

const divider = `<hr style="border:0;border-top:1px solid ${BRAND.line};margin:26px 0">`;
const small = (t) => `<p style="margin:0 0 10px;font:400 12px/1.6 Arial,sans-serif;color:${BRAND.muted}">${t}</p>`;

function bilingual({ subjectFr, subjectEn, titleFr, titleEn, fr, en, ctaFr, ctaEn, url, code, noteFr, noteEn }) {
  const block = (p, note) => p + (code ? codeBlock(code) : "") + (note ? small(note) : "");
  const body = `${block(fr, noteFr)}${url ? button(ctaFr, url) : ""}${divider}<p style="margin:0 0 6px;font:700 13px Arial,sans-serif;color:${BRAND.emerald}">English</p>${block(en, noteEn)}${url ? button(ctaEn, url) : ""}`;
  return { subject: `${subjectFr} · ${subjectEn}`, html: renderEmail({ lang: "fr", title: titleFr, preheader: subjectFr, bodyHtml: body, footer: false }) };
}

const T = {
  confirmation: bilingual({
    subjectFr: "Confirmez votre compte Nelvin", subjectEn: "Confirm your Nelvin account",
    titleFr: "Confirmez votre email", titleEn: "Confirm your email",
    fr: paragraph("Merci de rejoindre Nelvin. Confirmez votre adresse pour activer votre pass et accéder aux offres premium de nos partenaires."),
    en: paragraph("Thanks for joining Nelvin. Confirm your address to activate your pass and unlock premium perks from our partners."),
    ctaFr: "Confirmer mon email", ctaEn: "Confirm my email", url: "{{ .ConfirmationURL }}",
    noteFr: "Sur un autre appareil ? Saisissez ce code dans l'application : <strong>{{ .Token }}</strong>", noteEn: "On another device? Enter this code in the app: <strong>{{ .Token }}</strong>",
  }),
  recovery: bilingual({
    subjectFr: "Réinitialisez votre mot de passe", subjectEn: "Reset your password",
    titleFr: "Réinitialisation du mot de passe", titleEn: "Password reset",
    fr: paragraph("Nous avons reçu une demande de réinitialisation de votre mot de passe Nelvin. Ce lien est valable une heure."),
    en: paragraph("We received a request to reset your Nelvin password. This link is valid for one hour."),
    ctaFr: "Choisir un nouveau mot de passe", ctaEn: "Choose a new password", url: "{{ .ConfirmationURL }}",
    noteFr: "Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email : votre mot de passe reste inchangé.", noteEn: "Didn't request this? Ignore this email: your password stays unchanged.",
  }),
  magic_link: bilingual({
    subjectFr: "Votre lien de connexion Nelvin", subjectEn: "Your Nelvin sign-in link",
    titleFr: "Connexion sans mot de passe", titleEn: "Passwordless sign-in",
    fr: paragraph("Touchez le bouton pour vous connecter. Le lien expire rapidement et ne fonctionne qu'une fois."),
    en: paragraph("Tap the button to sign in. The link expires quickly and works only once."),
    ctaFr: "Me connecter", ctaEn: "Sign me in", url: "{{ .ConfirmationURL }}",
    noteFr: "Ou saisissez ce code : <strong>{{ .Token }}</strong>", noteEn: "Or enter this code: <strong>{{ .Token }}</strong>",
  }),
  invite: bilingual({
    subjectFr: "Vous êtes invité(e) sur Nelvin", subjectEn: "You're invited to Nelvin",
    titleFr: "Votre invitation Nelvin", titleEn: "Your Nelvin invitation",
    fr: paragraph("Votre entreprise ou un partenaire vous invite à rejoindre Nelvin. Créez votre accès pour profiter de vos avantages."),
    en: paragraph("Your company or a partner invited you to join Nelvin. Create your access to enjoy your perks."),
    ctaFr: "Accepter l'invitation", ctaEn: "Accept the invitation", url: "{{ .ConfirmationURL }}",
  }),
  email_change: bilingual({
    subjectFr: "Confirmez votre nouvelle adresse email", subjectEn: "Confirm your new email address",
    titleFr: "Changement d'adresse email", titleEn: "Email address change",
    fr: paragraph("Confirmez le changement de {{ .Email }} vers {{ .NewEmail }}."),
    en: paragraph("Confirm the change from {{ .Email }} to {{ .NewEmail }}."),
    ctaFr: "Confirmer le changement", ctaEn: "Confirm the change", url: "{{ .ConfirmationURL }}",
  }),
  reauthentication: bilingual({
    subjectFr: "Votre code de sécurité Nelvin", subjectEn: "Your Nelvin security code",
    titleFr: "Code de sécurité", titleEn: "Security code",
    fr: paragraph("Saisissez ce code pour confirmer une opération sensible sur votre compte. Ne le communiquez jamais, même à un agent Nelvin."),
    en: paragraph("Enter this code to confirm a sensitive action on your account. Never share it, not even with Nelvin staff."),
    code: "{{ .Token }}",
  }),
};

for (const [name, t] of Object.entries(T)) writeFileSync(new URL(`${name}.html`, dir), t.html);
writeFileSync(new URL("subjects.json", dir), JSON.stringify(Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v.subject])), null, 2));
console.log("Templates:", Object.keys(T).join(", "));
