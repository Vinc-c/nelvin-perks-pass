import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { entities } from "@/api/entities";
import { kycSignedUrl } from "@/api/storage";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Loader2, ChevronDown, FileText, ExternalLink, MapPin, Save } from "lucide-react";

const BADGE = {
  VERIFIED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL = { VERIFIED: "Validé", PENDING: "En attente", REJECTED: "Refusé", APPROVED: "Validé" };
const DOC_LABEL = {
  BUSINESS_REGISTRATION: "Registre du commerce",
  TAX_ID: "Identifiant fiscal",
  ID_DOCUMENT: "Pièce d'identité",
  PROOF_OF_ADDRESS: "Justificatif d'adresse",
  BANK_DETAILS: "Coordonnées bancaires",
  OTHER: "Autre",
};

function Documents({ merchantId }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState(null);
  React.useEffect(() => {
    entities.MerchantDocument.filter({ merchant_id: merchantId }, "-created_date").then(setDocs, () => setDocs([]));
  }, [merchantId]);

  const open = async (d) => {
    try {
      window.open(await kycSignedUrl(d.file_path), "_blank", "noopener");
    } catch (e) {
      toast({ title: "Lien indisponible", description: e.message, variant: "destructive" });
    }
  };
  const review = async (d, status) => {
    const note = status === "REJECTED" ? window.prompt("Motif du refus (visible par le partenaire)") : null;
    if (status === "REJECTED" && note === null) return;
    try {
      const updated = await entities.MerchantDocument.update(d.id, { status, review_note: note || null });
      setDocs((list) => list.map((x) => (x.id === d.id ? { ...x, ...updated } : x)));
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (!docs) return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
  if (!docs.length) return <p className="text-xs text-slate-500">Aucun document KYC envoyé.</p>;
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-800">{DOC_LABEL[d.doc_type] || d.doc_type}</span>
          <span className="truncate text-slate-500">{d.file_name}</span>
          <span className={`rounded-full px-2 py-0.5 ${BADGE[d.status]}`}>{STATUS_LABEL[d.status]}</span>
          {d.review_note && <span className="text-slate-400">« {d.review_note} »</span>}
          <span className="ml-auto flex gap-1">
            <button onClick={() => open(d)} className="flex items-center gap-1 rounded bg-white px-2 py-1 ring-1 ring-slate-200 hover:bg-slate-100"><ExternalLink className="h-3 w-3" /> Ouvrir</button>
            {d.status !== "APPROVED" && <button onClick={() => review(d, "APPROVED")} className="rounded bg-emerald-500 px-2 py-1 text-white hover:bg-emerald-600">Valider</button>}
            {d.status !== "REJECTED" && <button onClick={() => review(d, "REJECTED")} className="rounded bg-rose-100 px-2 py-1 text-rose-600 hover:bg-rose-200">Refuser</button>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Location({ merchant, onSaved }) {
  const { toast } = useToast();
  const [loc, setLoc] = useState({ address: merchant.address || "", city: merchant.city || "", country: merchant.country || "", lat: merchant.lat ?? "", lng: merchant.lng ?? "" });
  const save = async () => {
    const lat = loc.lat === "" ? null : Number(loc.lat);
    const lng = loc.lng === "" ? null : Number(loc.lng);
    if ((lat !== null && (lat < -90 || lat > 90)) || (lng !== null && (lng < -180 || lng > 180))) {
      toast({ title: "Coordonnées invalides", variant: "destructive" });
      return;
    }
    try {
      const updated = await entities.Merchant.update(merchant.id, { address: loc.address || null, city: loc.city, country: loc.country, lat, lng });
      onSaved(updated);
      toast({ title: "Adresse enregistrée", description: "Le partenaire apparaît sur la carte." });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };
  const input = "rounded-md border border-slate-200 px-2 py-1.5 text-xs";
  return (
    <div className="grid gap-2 sm:grid-cols-6">
      <input value={loc.address} onChange={(e) => setLoc({ ...loc, address: e.target.value })} placeholder="Adresse" aria-label="Adresse" className={`${input} sm:col-span-2`} />
      <input value={loc.city} onChange={(e) => setLoc({ ...loc, city: e.target.value })} placeholder="Ville" aria-label="Ville" className={input} />
      <input value={loc.country} onChange={(e) => setLoc({ ...loc, country: e.target.value })} placeholder="Pays" aria-label="Pays" className={input} />
      <input type="number" step="any" value={loc.lat} onChange={(e) => setLoc({ ...loc, lat: e.target.value })} placeholder="Latitude" aria-label="Latitude" className={input} />
      <div className="flex gap-1">
        <input type="number" step="any" value={loc.lng} onChange={(e) => setLoc({ ...loc, lng: e.target.value })} placeholder="Longitude" aria-label="Longitude" className={`${input} min-w-0 flex-1`} />
        <button onClick={save} className="rounded-md bg-slate-900 px-2 text-white" aria-label="Enregistrer l'adresse"><Save className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

export default function AdminMerchantRow({ merchant: m, onStatus, onChange }) {
  const [busy, setBusy] = useState(null);
  const [open, setOpen] = useState(false);
  const act = async (status) => {
    setBusy(status);
    try {
      await onStatus(m, status);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 items-center gap-3 text-left" aria-expanded={open}>
          {m.logo_url ? (
            <Image src={m.logo_url} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-500">{m.name?.[0]}</div>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-semibold text-slate-900">{m.name} <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} /></p>
            <p className="truncate text-xs text-slate-500">{m.offer_headline || "—"} · {m.offer_countries || m.country}</p>
            <p className="truncate text-xs text-slate-400">{m.contact_name} · {m.contact_email}{m.lat == null && <span className="ml-1 text-amber-600"><MapPin className="inline h-3 w-3" /> sans coordonnées</span>}</p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${BADGE[m.verified_status] || BADGE.PENDING}`}>{STATUS_LABEL[m.verified_status] || m.verified_status}</span>
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
      {open && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {m.application_notes && <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{m.application_notes}</p>}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents KYC</p>
            <Documents merchantId={m.id} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Localisation (carte des offres)</p>
            <Location merchant={m} onSaved={(u) => onChange?.(u)} />
          </div>
        </div>
      )}
    </div>
  );
}
