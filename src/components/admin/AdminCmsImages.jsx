import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import ImageUploader from "./ImageUploader";
import { Plus, Trash2, Loader2, ImageIcon } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500";
const SECTIONS = ["HERO", "LANDING", "MARKETING", "APP"];
// Keys are matched without regard to case/spaces ("Hero Background" = hero_background).
const slug = (k) => String(k || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const PRESETS = [
  { key: "hero_background", section: "HERO", hint: "Hero — add SEVERAL images with this key: they play as a slideshow" },
  { key: "savanna_band", section: "LANDING", hint: "Landscape band" },
  { key: "app_phone_mockup", section: "APP", hint: "Phone mockup (app section)" },
];

export default function AdminCmsImages() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ key: "", label: "", image_url: "", section: "LANDING" });

  const load = () => {
    setLoading(true);
    entities.SiteImage.list("-created_date").then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.key.trim() || !draft.image_url) return;
    try {
      await entities.SiteImage.create({ ...draft, key: slug(draft.key), active: true });
    } catch (err) {
      toast({ title: "Ajout impossible", description: err.message, variant: "destructive" });
      return;
    }
    setDraft({ key: "", label: "", image_url: "", section: "LANDING" });
    toast({ title: "Image ajoutée" });
    load();
  };

  const save = async (img, patch) => {
    await entities.SiteImage.update(img.id, patch);
    setItems((l) => l.map((x) => (x.id === img.id ? { ...x, ...patch } : x)));
  };
  const remove = async (img) => {
    await entities.SiteImage.delete(img.id);
    setItems((l) => l.filter((x) => x.id !== img.id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ImageIcon className="h-5 w-5 text-amber-500" /> Images de la plateforme</h2>
        <p className="text-sm text-slate-500">Gérez le visuel du hero, des bandes paysage, des bannières marketing et du mockup téléphone. Clés connues : <code>hero_background</code>, <code>savanna_band</code>, <code>app_phone_mockup</code>.</p>
        <p className="mt-1 text-sm text-slate-500"><strong>Hero :</strong> ajoutez plusieurs images avec la clé <code>hero_background</code> (section HERO) : elles défilent en diaporama sur la page d'accueil, de la plus ancienne à la plus récente. Désactivez une image pour la retirer.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <select className={inputCls} value={PRESETS.some((p) => p.key === slug(draft.key)) ? slug(draft.key) : ""} onChange={(e) => { const p = PRESETS.find((x) => x.key === e.target.value); if (p) setDraft({ ...draft, key: p.key, section: p.section, label: draft.label || p.hint }); }} aria-label="Emplacement">
          <option value="">Emplacement…</option>
          {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.key} — {p.hint}</option>)}
        </select>
        <input className={inputCls} placeholder="Clé * (ex. hero_background)" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} required />
        <input className={inputCls} placeholder="Libellé" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <select className={inputCls} value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })}>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" disabled={!draft.image_url} className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"><Plus className="h-4 w-4" /> Ajouter</button>
        <div className="sm:col-span-2 lg:col-span-4">
          <ImageUploader label="Image (obligatoire)" value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={img.image_url} alt="" className="h-36 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <input className={`${inputCls} font-semibold`} value={img.key} onChange={(e) => save(img, { key: e.target.value })} />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{img.section}</span>
                </div>
                <input className={inputCls} placeholder="Libellé" value={img.label || ""} onChange={(e) => save(img, { label: e.target.value })} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input type="checkbox" checked={img.active !== false} onChange={(e) => save(img, { active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-amber-600" /> Actif
                  </label>
                  <button onClick={() => remove(img)} className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}