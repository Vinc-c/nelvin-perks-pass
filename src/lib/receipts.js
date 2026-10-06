// PDF receipts generated from real ledger rows (no server round-trip).
const TYPE_LABEL = {
  SUBSCRIPTION: "Abonnement",
  RECHARGE: "Recharge wallet",
  COMPANY_TOPUP: "Budget avantages entreprise",
  WITHDRAWAL: "Retrait",
  PAYOUT: "Paiement marchand",
};

export async function downloadReceipt(tx, { user, company } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const number = `NEL-${new Date(tx.created_date).getFullYear()}-${String(tx.id).slice(0, 8).toUpperCase()}`;
  const amount = `${Number(tx.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tx.currency}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Nelvin Benefits", 48, 64);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Reçu de paiement", 48, 82);

  doc.setTextColor(20);
  doc.setFontSize(11);
  const rows = [
    ["Reçu n°", number],
    ["Date", new Date(tx.created_date).toLocaleString("fr-FR")],
    ["Client", company?.name || user?.full_name || user?.email || "—"],
    ["Email", user?.email || "—"],
    ["Objet", tx.description || TYPE_LABEL[tx.type] || tx.type],
    ["Moyen de paiement", tx.payment_method || "—"],
    ["Référence", tx.psp_reference || "—"],
    ["Statut", tx.status === "COMPLETED" ? "Payé" : tx.status],
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
  doc.text("Total", 48, y);
  doc.text(amount, 547, y, { align: "right" });
  if (tx.currency !== "USD" && tx.amount_usd) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`soit ${Number(tx.amount_usd).toFixed(2)} USD`, 547, y + 16, { align: "right" });
  }

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text("Plateforme Nelvin Benefits — développée par liafrik.com", 48, 800);
  doc.save(`${number}.pdf`);
}
