export const KYC_DOC_TYPES = [
  { value: "BUSINESS_REGISTRATION", label: "Registre de commerce (RCCM / équivalent)", required: true },
  { value: "TAX_ID", label: "Identifiant fiscal", required: true },
  { value: "ID_DOCUMENT", label: "Pièce d'identité du dirigeant", required: true },
  { value: "BANK_DETAILS", label: "RIB / justificatif Mobile Money", required: true },
  { value: "PROOF_OF_ADDRESS", label: "Justificatif d'adresse", required: false },
  { value: "OTHER", label: "Autre document", required: false },
];

export const kycLabel = (v) => KYC_DOC_TYPES.find((d) => d.value === v)?.label || v;

export const KYC_STATUS = {
  PENDING: { label: "En revue", tone: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Validé", tone: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Refusé", tone: "bg-rose-100 text-rose-700" },
};
