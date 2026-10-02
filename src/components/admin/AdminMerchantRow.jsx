import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Check, X, Loader2 } from "lucide-react";

const BADGE = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default function AdminMerchantRow({ merchant: m, onStatus }) {
  const [busy, setBusy] = useState(null);
  const act = async (status) => {
    setBusy(status);
    await onStatus(m, status);
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {m.logo_url ? (
          <Image src={m.logo_url} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">{m.name?.[0]}</div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{m.name}</p>
          <p className="truncate text-xs text-slate-500">{m.offer_headline || "—"} · {m.offer_countries || m.country}</p>
          <p className="truncate text-xs text-slate-400">{m.contact_name} · {m.contact_email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE[m.verified_status] || BADGE.PENDING}`}>{m.verified_status}</span>
        {m.verified_status !== "VERIFIED" && (
          <button disabled={!!busy} onClick={() => act("VERIFIED")} className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60">
            {busy === "VERIFIED" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Valider
          </button>
        )}
        {m.verified_status !== "REJECTED" && (
          <button disabled={!!busy} onClick={() => act("REJECTED")} className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-200 disabled:opacity-60">
            {busy === "REJECTED" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Rejeter
          </button>
        )}
      </div>
    </div>
  );
}