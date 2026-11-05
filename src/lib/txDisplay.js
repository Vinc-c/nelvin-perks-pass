// Display helpers for the member transaction list: English-first titles and status chips.
import { txLabel } from "@/pages/WalletActivity";

export function txTitle(tx, t, planName) {
  const d = String(tx.description || "");
  if (tx.type === "RECHARGE") return t("rd.tx.topup");
  if (tx.type === "SUBSCRIPTION" || tx.type === "GIFT") {
    const code = (d.match(/Pass\s+(Basic|Premium|VIP)/i) || [])[1];
    const name = code ? `Pass ${code.toUpperCase() === "VIP" ? "VIP" : code[0].toUpperCase() + code.slice(1).toLowerCase()}` : (planName?.(tx.plan_type) || txLabel(t, tx.type));
    const period = /annuel|annual|year/i.test(d) ? t("rd.tx.annual") : /mensuel|monthly|month/i.test(d) ? t("rd.tx.monthly") : "";
    const base = period ? `${name} – ${period}` : name;
    return tx.type === "GIFT" ? t("rd.tx.giftPass", { plan: base }) : base;
  }
  return tx.merchant_name || txLabel(t, tx.type) || tx.description || tx.type;
}

const CHIP = {
  PENDING: { key: "mb.tx.status.PENDING", cls: "bg-amber-100 text-amber-700" },
  COMPLETED: { key: "mb.tx.status.COMPLETED", cls: "bg-emerald-100 text-emerald-700" },
  REFUNDED: { key: "mb.tx.status.REFUNDED", cls: "bg-blue-100 text-blue-700" },
};
export function txChip(tx, t) {
  if (tx.type === "GIFT" && tx.status === "COMPLETED") return { label: t("rd.tx.gifted"), cls: "bg-nv-gold/20 text-nv-bronze" };
  const c = CHIP[tx.status];
  return c ? { label: t(c.key), cls: c.cls } : null;
}
