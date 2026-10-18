import React from "react";
import { slugify } from "@/lib/seo";

const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

/**
 * Editable SEO block (slug, title, description) with a search-result preview.
 * `value` = { slug, seo_title, seo_description }; `fallbackTitle` is shown in
 * the preview while the title is empty.
 */
export default function SeoFields({ value, onChange, fallbackTitle = "", fallbackDescription = "", basePath = "/" }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const title = value.seo_title || fallbackTitle;
  const desc = value.seo_description || fallbackDescription;
  const slug = value.slug || slugify(fallbackTitle);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Référencement (SEO)</p>
      <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <p className="truncate text-xs text-emerald-700">nelvin.app{basePath}{slug}</p>
        <p className="truncate text-base text-blue-700">{title || "Titre de la page"}</p>
        <p className="line-clamp-2 text-xs text-slate-500">{desc || "La description apparaît ici dans les résultats Google."}</p>
      </div>
      <label className="block text-sm">
        <span className="text-slate-500">Adresse de la page (slug)</span>
        <input value={value.slug || ""} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(fallbackTitle) || "mon-restaurant-abidjan"} className={input} />
      </label>
      <label className="block text-sm">
        <span className="flex justify-between text-slate-500"><span>Titre SEO</span><span className={(value.seo_title || "").length > 60 ? "text-amber-600" : ""}>{(value.seo_title || "").length}/70</span></span>
        <input maxLength={70} value={value.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} placeholder="Ex. Restaurant Chez Awa à Abidjan — Privilèges Nelvin" className={input} />
      </label>
      <label className="block text-sm">
        <span className="flex justify-between text-slate-500"><span>Description SEO</span><span className={(value.seo_description || "").length > 160 ? "text-amber-600" : ""}>{(value.seo_description || "").length}/200</span></span>
        <textarea maxLength={200} rows={2} value={value.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} placeholder="Une phrase claire : quoi, où, quel avantage pour les membres." className={input} />
      </label>
    </div>
  );
}
