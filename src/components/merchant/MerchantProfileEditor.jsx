import React, { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import SeoFields from "@/components/seo/SeoFields";
import { useI18n } from "@/i18n/I18nContext";

const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

/**
 * Public profile of a partner: description, headline, contacts and SEO.
 * Used by the merchant (own profile) and by admins (any partner); the database
 * policies allow both, only verification, rating and balance stay protected.
 */
export default function MerchantProfileEditor({ merchant, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    description: merchant.description || "",
    offer_headline: merchant.offer_headline || "",
    offer_terms: merchant.offer_terms || "",
    whatsapp: merchant.whatsapp || "",
    website: merchant.website || "",
    instagram: merchant.instagram || "",
    facebook: merchant.facebook || "",
    slug: merchant.slug || "",
    seo_title: merchant.seo_title || "",
    seo_description: merchant.seo_description || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      const updated = await entities.Merchant.update(merchant.id, {
        description: f.description.trim() || null,
        offer_headline: f.offer_headline.trim() || null,
        offer_terms: f.offer_terms.trim() || null,
        whatsapp: f.whatsapp.trim() || null,
        website: f.website.trim() || null,
        instagram: f.instagram.trim() || null,
        facebook: f.facebook.trim() || null,
        slug: f.slug || "",
        seo_title: f.seo_title.trim() || null,
        seo_description: f.seo_description.trim() || null,
      });
      onSaved?.(updated);
      if (updated?.slug) setF((x) => ({ ...x, slug: updated.slug }));
      toast({ title: t("mc.pe.saved") });
    } catch (e) {
      toast({ title: t("mc.pe.saveFailed"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm"><span className="text-slate-500">{t("mc.pe.headline")}</span>
        <input value={f.offer_headline} maxLength={300} onChange={set("offer_headline")} className={input} /></label>
      <label className="block text-sm"><span className="text-slate-500">{t("mc.pe.description")}</span>
        <textarea rows={3} value={f.description} maxLength={2000} onChange={set("description")} className={input} /></label>
      <label className="block text-sm"><span className="text-slate-500">{t("mc.pe.terms")}</span>
        <textarea rows={2} value={f.offer_terms} maxLength={4000} onChange={set("offer_terms")} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm"><span className="text-slate-500">{t("mc.pe.whatsapp")}</span>
          <input value={f.whatsapp} onChange={set("whatsapp")} className={input} /></label>
        <label className="block text-sm"><span className="text-slate-500">{t("mc.pe.website")}</span>
          <input value={f.website} onChange={set("website")} className={input} /></label>
        <label className="block text-sm"><span className="text-slate-500">Instagram</span>
          <input value={f.instagram} onChange={set("instagram")} className={input} /></label>
        <label className="block text-sm"><span className="text-slate-500">Facebook</span>
          <input value={f.facebook} onChange={set("facebook")} className={input} /></label>
      </div>
      <SeoFields
        value={f}
        onChange={(v) => setF({ ...f, ...v })}
        fallbackTitle={merchant.city ? t("mc.pe.seoFallback", { name: merchant.name, city: merchant.city }) : `${merchant.name} | Nelvin`}
        fallbackDescription={f.description}
        basePath="/partenaire/"
      />
      <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("mc.pe.save")}
      </button>
    </div>
  );
}
