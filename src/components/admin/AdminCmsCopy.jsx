import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2, Type } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500";
const SECTIONS = ["HERO", "STATS", "MARKETING", "GENERAL"];

export default function AdminCmsCopy() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ key: "", label: "", value: "", section: "MARKETING" });

  const load = () => {
    setLoading(true);
    base44.entities.SiteCopy.list("-created_date").then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.key.trim() || !draft.value.trim()) return;
    await base44.entities.SiteCopy.create({ ...draft, key: draft.key.trim() });
    setDraft({ key: "", label: "", value: "", section: "MARKETING" });
    toast({ title: "Texte ajouté" });
    load();
  };

  const save = async (c, patch) => {
    await base44.entities.SiteCopy.update(c.id, patch);
    setItems((l) => l.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
  };
  const remove = async (c) => {
    await base44.entities.SiteCopy.delete(c.id);
    setItems((l) => l.filter((x) => x.id !== c.id));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Type className="h-5 w-5 text-amber-500" /> Textes marketing</h2>
        <p className="text-sm text-slate-500">Titres, sous-titres, badges, statistiques. Clés connues : <code>hero.badge</code>, <code>hero.title</code>, <code>hero.subtitle</code>, <code>stats.saved</code>, <code>stats.brands</code>, <code>stats.offers</code>, <code>stats.collections</code>.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input className={inputCls} placeholder="Clé * (ex. hero.title)" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} required />
        <input className={inputCls} placeholder="Libellé" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <select className={inputCls} value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })}>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className={inputCls} placeholder="Valeur *" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} required />
        <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"><Plus className="h-4 w-4" /> Ajouter</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{c.section}</span>
              <input className={`${inputCls} max-w-[180px] font-mono`} value={c.key} onChange={(e) => save(c, { key: e.target.value })} />
              <input className={`${inputCls} max-w-[180px]`} placeholder="Libellé" value={c.label || ""} onChange={(e) => save(c, { label: e.target.value })} />
              <input className={`${inputCls} flex-1 min-w-[200px]`} value={c.value} onChange={(e) => save(c, { value: e.target.value })} />
              <button onClick={() => remove(c)} className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}