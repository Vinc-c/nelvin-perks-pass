import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import MediaUploader from "./MediaUploader";
import { Plus, Trash2, Loader2, ImageIcon } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500";
const SECTIONS = ["HERO", "LANDING", "MARKETING", "APP"];
// Keys are matched without regard to case/spaces ("Hero Background" = hero_background).
const slug = (k) => String(k || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const PRESETS = [
  { key: "hero_background", section: "HERO", hint: "Hero — add SEVERAL images with this key: they play as a slideshow" },
  { key: "savanna_band", section: "LANDING", hint: "Landscape band" },
  { key: "app_phone_mockup", section: "APP", hint: "Phone mockup (app section)" },
  { key: "site_logo", section: "LANDING", hint: "Full logo, used in every header, footer and sign-in page" },
  { key: "site_icon", section: "LANDING", hint: "Logo mark (cards, dark backgrounds)" },
  { key: "auth_background", section: "LANDING", hint: "Large image on the login / register pages" },
];

export default function AdminCmsImages() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const emptyDraft = { key: "", label: "", image_url: "", section: "LANDING", media_type: "image", poster_url: "" };
  const [draft, setDraft] = useState(emptyDraft);

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
      toast({ title: "Could not add image", description: err.message, variant: "destructive" });
      return;
    }
    setDraft(emptyDraft);
    toast({ title: "Image added" });
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
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ImageIcon className="h-5 w-5 text-amber-500" /> Platform images</h2>
        <p className="text-sm text-slate-500">Manage the hero visual, landscape bands, marketing banners and the phone mockup. Known keys: <code>hero_background</code>, <code>savanna_band</code>, <code>app_phone_mockup</code>.</p>
        <p className="mt-1 text-sm text-slate-500"><strong>Hero:</strong> add several images and/or landscape videos (MP4/WebM, 50 MB max) with the key <code>hero_background</code> (HERO section): they play as a slideshow on the home page, from oldest to newest. A video plays once, silently, then the next slide starts. Deactivate an image to remove it.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <select className={inputCls} value={PRESETS.some((p) => p.key === slug(draft.key)) ? slug(draft.key) : ""} onChange={(e) => { const p = PRESETS.find((x) => x.key === e.target.value); if (p) setDraft({ ...draft, key: p.key, section: p.section, label: draft.label || p.hint }); }} aria-label="Placement">
          <option value="">Placement…</option>
          {PRESETS.map((p) => <option key={p.key} value={p.key}>{p.key} — {p.hint}</option>)}
        </select>
        <input className={inputCls} placeholder="Key * (e.g. hero_background)" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} required />
        <input className={inputCls} placeholder="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <select className={inputCls} value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })}>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" disabled={!draft.image_url} className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"><Plus className="h-4 w-4" /> Add</button>
        <div className="sm:col-span-2 lg:col-span-4">
          <MediaUploader label="Image or video (required)" value={{ url: draft.image_url, media_type: draft.media_type, poster_url: draft.poster_url }} onChange={(v) => setDraft({ ...draft, image_url: v.url, media_type: v.media_type, poster_url: v.poster_url })} />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {img.media_type === "video"
                ? <video src={img.image_url} poster={img.poster_url || undefined} muted playsInline controls preload="metadata" className="h-36 w-full bg-black object-cover" />
                : <img src={img.image_url} alt="" className="h-36 w-full object-cover" />}
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <input className={`${inputCls} font-semibold`} value={img.key} onChange={(e) => save(img, { key: e.target.value })} />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{img.media_type === "video" ? "VIDEO · " : ""}{img.section}</span>
                </div>
                <input className={inputCls} placeholder="Label" value={img.label || ""} onChange={(e) => save(img, { label: e.target.value })} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input type="checkbox" checked={img.active !== false} onChange={(e) => save(img, { active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-amber-600" /> Active
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