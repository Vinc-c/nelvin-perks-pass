import React, { useRef, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { uploadKycFile, kycSignedUrl, removeKycFile } from "@/api/storage";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { KYC_DOC_TYPES, KYC_STATUS, kycLabel } from "@/lib/kyc";
import { Upload, FileText, ShieldCheck, Clock, Loader2, Trash2, ExternalLink, Store, Lock } from "lucide-react";

export default function KycVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const merchantId = user?.merchant_id;
  const [docType, setDocType] = useState("BUSINESS_REGISTRATION");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const { data, loading, reload } = useAsync(async () => {
    if (!merchantId) return null;
    const [merchant, docs] = await Promise.all([
      entities.Merchant.get(merchantId).catch(() => null),
      entities.MerchantDocument.filter({ merchant_id: merchantId }, "-created_date", 50),
    ]);
    return { merchant, docs };
  }, [merchantId]);

  if (!merchantId) {
    return (
      <PortalLayout title="Vérification KYC" theme="light">
        <EmptyState icon={Store} title="Aucune marque liée" description="Déposez d'abord votre candidature partenaire pour accéder à la vérification." />
      </PortalLayout>
    );
  }
  if (loading || !data) return <PortalLayout title="Vérification KYC" theme="light"><Spinner /></PortalLayout>;

  const docs = data.docs || [];
  const required = KYC_DOC_TYPES.filter((d) => d.required);
  const stateOf = (type) => {
    const list = docs.filter((d) => d.doc_type === type);
    if (list.some((d) => d.status === "APPROVED")) return "APPROVED";
    if (list.some((d) => d.status === "PENDING")) return "PENDING";
    if (list.some((d) => d.status === "REJECTED")) return "REJECTED";
    return null;
  };
  const approvedCount = required.filter((d) => stateOf(d.value) === "APPROVED").length;
  const submittedCount = required.filter((d) => stateOf(d.value)).length;
  const merchantStatus = data.merchant?.verified_status;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { path } = await uploadKycFile(file, merchantId);
      try {
        await entities.MerchantDocument.create({ merchant_id: merchantId, doc_type: docType, file_path: path, file_name: file.name.slice(0, 200) });
      } catch (err) {
        await removeKycFile(path);
        throw err;
      }
      toast({ title: "Document envoyé", description: "Notre équipe le vérifie sous 2 à 3 jours ouvrés." });
      reload();
    } catch (err) {
      toast({ title: "Envoi impossible", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const open = async (doc) => {
    try {
      window.open(await kycSignedUrl(doc.file_path), "_blank", "noopener");
    } catch (err) {
      toast({ title: "Lien indisponible", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (doc) => {
    if (!window.confirm("Supprimer ce document ?")) return;
    try {
      await entities.MerchantDocument.delete(doc.id);
      await removeKycFile(doc.file_path);
      reload();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err.message, variant: "destructive" });
    }
  };

  return (
    <PortalLayout title="Vérification KYC" theme="light">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Upload, label: "Documents requis envoyés", value: `${submittedCount} / ${required.length}`, done: submittedCount === required.length },
          { icon: Clock, label: "Documents validés", value: `${approvedCount} / ${required.length}`, done: approvedCount === required.length },
          { icon: ShieldCheck, label: "Statut partenaire", value: merchantStatus === "VERIFIED" ? "Vérifié" : merchantStatus === "REJECTED" ? "Refusé" : "En attente", done: merchantStatus === "VERIFIED" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 shadow-sm ${s.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <s.icon className={`h-5 w-5 ${s.done ? "text-emerald-600" : "text-slate-400"}`} />
            <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard icon={Upload} title="Envoyer un document">
          <label className="block text-sm text-slate-600">
            Type de document
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
              {KYC_DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}{d.required ? " *" : ""}</option>)}
            </select>
          </label>
          <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-6 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />} PDF ou image, 10 Mo max
          </button>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400"><Lock className="mt-0.5 h-3 w-3 shrink-0" /> Stockage privé : seuls vous et l'équipe conformité Nelvin pouvez consulter ces fichiers.</p>
        </SectionCard>

        <SectionCard icon={FileText} title="Pièces requises" className="lg:col-span-2">
          <div className="space-y-2">
            {KYC_DOC_TYPES.map((t) => {
              const st = stateOf(t.value);
              const list = docs.filter((d) => d.doc_type === t.value);
              return (
                <div key={t.value} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{t.label}{t.required && <span className="text-rose-500"> *</span>}</p>
                    {st ? <span className={`rounded-full px-2 py-0.5 text-xs ${KYC_STATUS[st].tone}`}>{KYC_STATUS[st].label}</span> : <span className="text-xs text-slate-400">Non envoyé</span>}
                  </div>
                  {list.map((d) => (
                    <div key={d.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="truncate text-slate-600">{d.file_name || kycLabel(d.doc_type)} · {new Date(d.created_date).toLocaleDateString("fr-FR")}{d.review_note ? ` — ${d.review_note}` : ""}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <button onClick={() => open(d)} className="text-emerald-600 hover:underline" aria-label="Ouvrir"><ExternalLink className="h-3.5 w-3.5" /></button>
                        {d.status === "PENDING" && <button onClick={() => remove(d)} className="text-rose-500" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PortalLayout>
  );
}
