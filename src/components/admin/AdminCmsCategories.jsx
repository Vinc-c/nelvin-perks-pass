import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import ImageUploader from "./ImageUploader";
import { OFFER_CATEGORIES } from "@/data/offerCategories";
import { Plus, Trash2, Loader2, Star, Sparkles, ImageOff } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500";

export default function AdminCmsCategories() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ value: "", label: "", emoji: "", description: "", image_url: "", sort_order: 0 });

  const load = () => {
    setLoading(true);
    entities.Category.list("sort_order").then(setRows).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.value.trim() || !draft.label.trim()) {
      toast({ title: "Key and label required", variant: "destructive" });
      return;
    }
    if (rows.some((r) => r.value === draft.value.trim())) {
      toast({ title: "This category already exists", variant: "destructive" });
      return;
    }
    await entities.Category.create({ ...draft, value: draft.value.trim(), active: true });
    setDraft({ value: "", label: "", emoji: "", description: "", image_url: "", sort_order: rows.length });
    toast({ title: "Category added" });
    load();
  };

  const save = (row, patch) => {
    entities.Category.update(row.id, patch).then(() => {
      setRows((l) => l.map((x) => (x.id === row.id ? { ...x, ...patch } : x)));
    });
  };

  const remove = async (row) => {
    await entities.Category.delete(row.id);
    setRows((l) => l.filter((x) => x.id !== row.id));
    toast({ title: "Category deleted" });
  };

  const seedDefaults = async () => {
    const existing = new Set(rows.map((r) => r.value));
    const missing = OFFER_CATEGORIES.filter((c) => !existing.has(c.value));
    if (missing.length === 0) {
      toast({ title: "All default categories already exist" });
      return;
    }
    await entities.Category.bulkCreate(
      missing.map((c, i) => ({
        value: c.value,
        label: c.label,
        emoji: c.emoji,
        active: true,
        sort_order: rows.length + i,
      }))
    );
    toast({ title: `${missing.length} categories imported` });
    load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Star className="h-5 w-5 text-amber-500" /> Offer categories</h2>
          <p className="text-sm text-slate-500">Single source of category labels, emojis and images — reflected in the directory, listings, and merchant and partner forms.</p>
        </div>
        <button onClick={seedDefaults} className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Sparkles className="h-4 w-4" /> Import defaults
        </button>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input className={inputCls} placeholder="Key (e.g. FOOD_DINING) *" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value.toUpperCase() })} required />
        <input className={inputCls} placeholder="Label * (e.g. Dining)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} required />
        <input className={`${inputCls} max-w-[80px]`} placeholder="Emoji" value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
        <input className={inputCls} placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <input type="number" className={inputCls} placeholder="Order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"><Plus className="h-4 w-4" /> Add</button>
        <div className="sm:col-span-2 lg:col-span-6">
          <ImageUploader label="Category image (optional)" value={draft.image_url} onChange={(v) => setDraft({ ...draft, image_url: v })} />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">No categories. Click “Import defaults” to get started.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {r.image_url ? (
                <img src={r.image_url} alt="" className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-300"><ImageOff className="h-5 w-5" /></div>
              )}
              <input className={`${inputCls} max-w-[120px] font-mono text-xs`} value={r.value} onChange={(e) => save(r, { value: e.target.value.toUpperCase() })} />
              <input className={`${inputCls} max-w-[180px]`} value={r.label} onChange={(e) => save(r, { label: e.target.value })} />
              <input className={`${inputCls} max-w-[60px] text-center`} value={r.emoji || ""} onChange={(e) => save(r, { emoji: e.target.value })} />
              <input className={`${inputCls} max-w-[220px]`} placeholder="Description" value={r.description || ""} onChange={(e) => save(r, { description: e.target.value })} />
              <ImageUploader value={r.image_url} onChange={(v) => save(r, { image_url: v })} />
              <input type="number" className={`${inputCls} w-20`} value={r.sort_order || 0} onChange={(e) => save(r, { sort_order: Number(e.target.value) })} />
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                <input type="checkbox" checked={r.active !== false} onChange={(e) => save(r, { active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-amber-600" /> Active
              </label>
              <button onClick={() => remove(r)} className="ml-auto rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}