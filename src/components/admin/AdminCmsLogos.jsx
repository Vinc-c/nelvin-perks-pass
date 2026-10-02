import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ImageUploader from "./ImageUploader";
import { Plus, Trash2, Loader2, GripVertical, Star, Upload } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500";

export default function AdminCmsLogos() {
  const { toast } = useToast();
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: "", category: "", domain: "", logo_url: "", sort_order: 0 });
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);

  const load = () => {
    setLoading(true);
    base44.entities.PartnerLogo.list("sort_order").then(setLogos).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await base44.entities.PartnerLogo.create({ ...draft, name: draft.name.trim(), active: true });
    setDraft({ name: "", category: "", domain: "", logo_url: "", sort_order: logos.length });
    toast({ title: "Logo ajouté" });
    load();
  };

  const save = async (logo, patch) => {
    await base44.entities.PartnerLogo.update(logo.id, patch);
    setLogos((l) => l.map((x) => (x.id === logo.id ? { ...x, ...patch } : x)));
  };

  const remove = async (logo) => {
    await base44.entities.PartnerLogo.delete(logo.id);
    setLogos((l) => l.filter((x) => x.id !== logo.id));
    toast({ title: "Logo supprimé" });
  };

  const bulkUpload = async (files) => {
    if (!files || !files.length) return;
    setBulkBusy(true);
    setBulkDone(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        const name = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        await base44.entities.PartnerLogo.create({
          name: name || `Partner ${logos.length + i + 1}`,
          logo_url: file_url,
          active: true,
          sort_order: logos.length + i,
        });
        setBulkDone(i + 1);
      }
      toast({ title: `${files.length} logos ajoutés` });
      load();
    } finally {
      setBulkBusy(false);
      setBulkDone(0);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Star className="h-5 w-5 text-amber-500" /> Logos partenaires</h2>
        <p className="text-sm text-slate-500">Ces logos défilent sous le hero de la page d'accueil. Ajoutez, réordonnez, activez.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input className={inputCls} placeholder="Nom *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
        <input className={inputCls} placeholder="Catégorie" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <input className={inputCls} placeholder="Domaine (clearbit)" value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value })} />
        <input type="number" className={inputCls} placeholder="Ordre" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"><Plus className="h-4 w-4" /> Ajouter</button>
        <div className="sm:col-span-2 lg:col-span-5">
          <ImageUploader label="Logo (optionnel — sinon Clearbit par domaine)" value={draft.logo_url} onChange={(v) => setDraft({ ...draft, logo_url: v })} />
        </div>
      </form>

      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-5">
        <p className="text-sm font-semibold text-slate-800">Téléverser plusieurs logos en une fois</p>
        <p className="mt-1 text-xs text-slate-500">Sélectionnez plusieurs images — chaque fichier devient un partenaire (le nom vient du nom du fichier).</p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
          {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {bulkBusy ? `Upload ${bulkDone}…` : "Choisir des images"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => bulkUpload(Array.from(e.target.files || []))} disabled={bulkBusy} />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : logos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">Aucun logo. Ajoutez-en ci-dessus.</p>
      ) : (
        <div className="space-y-2">
          {logos.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <GripVertical className="h-4 w-4 text-slate-300" />
              <img src={l.logo_url || `https://logo.clearbit.com/${l.domain || ""}`} onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-10 w-10 rounded-lg bg-slate-100 object-contain" alt="" />
              <input className={`${inputCls} max-w-[160px]`} value={l.name} onChange={(e) => save(l, { name: e.target.value })} />
              <input className={`${inputCls} max-w-[140px]`} placeholder="Catégorie" value={l.category || ""} onChange={(e) => save(l, { category: e.target.value })} />
              <input className={`${inputCls} max-w-[160px]`} placeholder="Domaine" value={l.domain || ""} onChange={(e) => save(l, { domain: e.target.value })} />
              <input type="number" className={`${inputCls} w-20`} value={l.sort_order || 0} onChange={(e) => save(l, { sort_order: Number(e.target.value) })} />
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" checked={l.active !== false} onChange={(e) => save(l, { active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-amber-600" /> Actif
              </label>
              <button onClick={() => remove(l)} className="ml-auto rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}