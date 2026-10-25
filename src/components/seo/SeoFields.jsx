import React from "react";
import { slugify } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nContext";

const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

/**
 * Editable SEO block (slug, title, description) with a search-result preview.
 * `value` = { slug, seo_title, seo_description }; `fallbackTitle` is shown in
 * the preview while the title is empty.
 */
export default function SeoFields({ value, onChange, fallbackTitle = "", fallbackDescription = "", basePath = "/" }) {
  const { t } = useI18n();
  const set = (k, v) => onChange({ ...value, [k]: v });
  const title = value.seo_title || fallbackTitle;
  const desc = value.seo_description || fallbackDescription;
  const slug = value.slug || slugify(fallbackTitle);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("mc.seo.heading")}</p>
      <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <p className="truncate text-xs text-emerald-700">nelvin.app{basePath}{slug}</p>
        <p className="truncate text-base text-blue-700">{title || t("mc.seo.pageTitle")}</p>
        <p className="line-clamp-2 text-xs text-slate-500">{desc || t("mc.seo.pageDesc")}</p>
      </div>
      <label className="block text-sm">
        <span className="text-slate-500">{t("mc.seo.slug")}</span>
        <input value={value.slug || ""} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={slugify(fallbackTitle) || "mon-restaurant-abidjan"} className={input} />
      </label>
      <label className="block text-sm">
        <span className="flex justify-between text-slate-500"><span>{t("mc.seo.title")}</span><span className={(value.seo_title || "").length > 60 ? "text-amber-600" : ""}>{(value.seo_title || "").length}/70</span></span>
        <input maxLength={70} value={value.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} placeholder={t("mc.seo.titlePlaceholder")} className={input} />
      </label>
      <label className="block text-sm">
        <span className="flex justify-between text-slate-500"><span>{t("mc.seo.description")}</span><span className={(value.seo_description || "").length > 160 ? "text-amber-600" : ""}>{(value.seo_description || "").length}/200</span></span>
        <textarea maxLength={200} rows={2} value={value.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} placeholder={t("mc.seo.descPlaceholder")} className={input} />
      </label>
    </div>
  );
}
