import { translate } from "@/i18n/translate";

// Labels are resolved on access so they follow the current language.
const withLabel = (o, key) => Object.defineProperty(o, "label", { enumerable: true, get: () => translate(key) });

export const KYC_DOC_TYPES = [
  ["BUSINESS_REGISTRATION", true],
  ["TAX_ID", true],
  ["ID_DOCUMENT", true],
  ["BANK_DETAILS", true],
  ["PROOF_OF_ADDRESS", false],
  ["OTHER", false],
].map(([value, required]) => withLabel({ value, required }, `mb.kyc.doc.${value}`));

export const kycLabel = (v) => KYC_DOC_TYPES.find((d) => d.value === v)?.label || v;

export const KYC_STATUS = {
  PENDING: withLabel({ tone: "bg-amber-100 text-amber-700" }, "mb.kyc.st.PENDING"),
  APPROVED: withLabel({ tone: "bg-emerald-100 text-emerald-700" }, "mb.kyc.st.APPROVED"),
  REJECTED: withLabel({ tone: "bg-rose-100 text-rose-700" }, "mb.kyc.st.REJECTED"),
};
