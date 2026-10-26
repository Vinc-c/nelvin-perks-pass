// PDF receipts generated from real ledger rows (no server round-trip).
import { translations } from "@/i18n/translations";
import { currentLang } from "@/i18n/translate";

// The PDF font (Helvetica) only covers Latin text, so Arabic and Yoruba
// receipts are issued in English.
function pdfLang() {
  const l = currentLang();
  return l === "ar" || l === "yo" ? "en" : l;
}

/** Translator + locale for generated PDFs (Latin-script languages only). */
export function pdfI18n() {
  const lang = pdfLang();
  const tr = (key, vars) => {
    const text = (translations[lang] && translations[lang][key]) || translations.en[key] || key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
  };
  return { tr, locale: { en: "en-GB", fr: "fr-FR", sw: "sw-KE" }[lang] || "en-GB" };
}

export async function downloadReceipt(tx, { user, company } = {}) {
  const { jsPDF } = await import("jspdf");
  const lang = pdfLang();
  const tr = (key, vars) => {
    const text = (translations[lang] && translations[lang][key]) || translations.en[key] || key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text;
  };
  const locale = { en: "en-GB", fr: "fr-FR", sw: "sw-KE" }[lang] || "en-GB";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const number = `NEL-${new Date(tx.created_date).getFullYear()}-${String(tx.id).slice(0, 8).toUpperCase()}`;
  const amount = `${Number(tx.amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tx.currency}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Nelvin Benefits", 48, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(tr("rc.title"), 48, 82);

  doc.setTextColor(20);
  doc.setFontSize(11);
  const rows = [
    [tr("rc.number"), number],
    [tr("rc.date"), new Date(tx.created_date).toLocaleString(locale)],
    [tr("rc.client"), company?.name || user?.full_name || user?.email || "—"],
    [tr("rc.email"), user?.email || "—"],
    [tr("rc.subject"), tx.description || (tx.type && `rc.t.${tx.type}` in translations.en ? tr(`rc.t.${tx.type}`) : tx.type)],
    [tr("rc.method"), tx.payment_method || "—"],
    [tr("rc.ref"), tx.psp_reference || "—"],
    [tr("rc.status"), tx.status === "COMPLETED" ? tr("rc.paid") : tx.status],
  ];
  let y = 130;
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, 48, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), 200, y, { maxWidth: 340 });
    y += 24;
  });

  doc.setDrawColor(220);
  doc.line(48, y, 547, y);
  y += 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(tr("rc.total"), 48, y);
  doc.text(amount, 547, y, { align: "right" });
  if (tx.currency !== "USD" && tx.amount_usd) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(tr("rc.equiv", { n: Number(tx.amount_usd).toFixed(2) }), 547, y + 16, { align: "right" });
  }

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(tr("rc.footer"), 48, 800);
  doc.save(`${number}.pdf`);
}
