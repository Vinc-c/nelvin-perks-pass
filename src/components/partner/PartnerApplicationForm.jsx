import React, { useState } from "react";
import { motion } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { uploadPublicFile } from "@/api/storage";
import {
  User, Building2, Tag, Globe, Shield, FileText, Upload, Check, Plus, X, Sparkles, Loader2, MapPin,
} from "lucide-react";
import AfricanCountrySelect from "./AfricanCountrySelect";
import LocationPicker from "@/components/map/LocationPicker";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/i18n/I18nContext";

const REDEEM = ["ONLINE", "OFFLINE", "BOTH"];

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-t-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-4 text-white">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-base font-bold leading-tight">{title}</p>
        <p className="text-xs text-cyan-50">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <p className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function FileDrop({ label, hint, file, onPick }) {
  const { t } = useI18n();
  return (
    <label className="block">
      <p className="text-sm font-medium text-slate-700">
        {label} <span className="text-rose-500">*</span>
      </p>
      <p className="text-xs text-slate-400">{hint}</p>
      <div className="mt-1.5 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Check className="h-4 w-4 text-emerald-600" /> {file.name}
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            <Upload className="mx-auto mb-1 h-5 w-5" />
            {t("mc.pf.drop")}
            <span className="mt-1 block text-xs">{t("mc.pf.dropHint")}</span>
          </div>
        )}
      </div>
    </label>
  );
}

// First day an offer may expire: the platform requires 12 months of validity.
const minExpiry = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Partner application. `defaults` pre-fills the signed-in applicant's details
 * (email, contactName, contactPhone); `onSubmitted` replaces the built-in
 * confirmation screen (e.g. to open the dashboard directly).
 */
export default function PartnerApplicationForm({ onSubmitted, defaults = {} }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    email: defaults.email || "", brandName: "", contactName: defaults.contactName || "", contactPhone: defaults.contactPhone || "", city: "",
    category: "",
    description: "", supportEmail: "", website: "", instagram: "", facebook: "", whatsapp: "",
    offerHeadline: "", offerHowToUse: "", offerRedeemable: "BOTH", offerTerms: "", offerExpiry: "",
    countries: [], notes: "",
  });
  const [place, setPlace] = useState({ address: "", lat: null, lng: null });
  const [tc, setTc] = useState({ multi: false, twelve: false, openAll: false, better: false });
  const [files, setFiles] = useState({ logo: null, cover: null, product: null });
  const [extraOffers, setExtraOffers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { categories } = useCategories();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addOffer = () =>
    setExtraOffers((o) => [...o, { headline: "", howToUse: "", redeemable: "BOTH", terms: "", expiry: "" }]);
  const removeOffer = (i) => setExtraOffers((o) => o.filter((_, idx) => idx !== i));
  const setExtra = (i, k, v) =>
    setExtraOffers((o) => o.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.brandName || !form.contactName || !form.contactPhone || !form.city)
      return setError(t("mc.pf.e.basic"));
    if (!form.category) return setError(t("mc.pf.e.category"));
    if (!form.description || !form.supportEmail || !form.website)
      return setError(t("mc.pf.e.brand"));
    if (!files.logo || !files.cover || !files.product)
      return setError(t("mc.pf.e.files"));
    if (!form.offerHeadline || !form.offerHowToUse || !form.offerExpiry)
      return setError(t("mc.pf.e.offer"));
    if (form.offerExpiry < minExpiry())
      return setError(t("mc.pf.e.expiry"));
    if (form.offerRedeemable !== "ONLINE" && (place.lat == null || place.lng == null))
      return setError(t("mc.pf.e.map"));
    if (form.countries.length === 0) return setError(t("mc.pf.e.countries"));
    if (!tc.multi || !tc.twelve || !tc.openAll || !tc.better)
      return setError(t("mc.pf.e.terms"));

    try {
      setBusy(true);
      setUploading(true);
      const [logo, cover, product] = await Promise.all([
        uploadPublicFile(files.logo, "applications"),
        uploadPublicFile(files.cover, "applications"),
        uploadPublicFile(files.product, "applications"),
      ]);
      setUploading(false);

      const extraText = extraOffers.length
        ? "\n\nAdditional offers:\n" +
          extraOffers
            .map((o, i) => `#${i + 2}: ${o.headline} | how to use: ${o.howToUse} | redemption: ${o.redeemable} | terms: ${o.terms} | expiry: ${o.expiry}`)
            .join("\n")
        : "";

      const res = await invokeFunction("submit-partner-application", {
        email: form.email,
        brandName: form.brandName,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        city: form.city,
        category: form.category,
        address: place.address || "",
        lat: place.lat,
        lng: place.lng,
        description: form.description,
        supportEmail: form.supportEmail,
        website: form.website,
        instagram: form.instagram,
        facebook: form.facebook,
        whatsapp: form.whatsapp,
        logoUrl: logo.file_url,
        coverUrl: cover.file_url,
        productUrl: product.file_url,
        offerHeadline: form.offerHeadline,
        offerHowToUse: form.offerHowToUse,
        offerRedeemable: form.offerRedeemable,
        offerTerms: form.offerTerms,
        offerExpiry: form.offerExpiry,
        countries: form.countries,
        notes: (form.notes || "") + extraText,
        termsConfirmed: [tc.multi, tc.twelve, tc.openAll, tc.better],
      });

      if (res.data?.error) return setError(res.data.error);
      if (onSubmitted) { onSubmitted(); return; }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || t("mc.pf.e.send"));
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">{t("mc.pf.done")}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("mc.pf.doneD")}
        </p>
        {/* Plain links (full reload): the account just became a MERCHANT server-side. */}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/kyc-verification" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            {t("mc.pf.doneKyc")}
          </a>
          <a href="/merchant-dashboard" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {t("mc.pf.doneTrack")}
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">

      {/* Basic Information */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={User} title={t("mc.pf.s.basic")} subtitle={t("mc.pf.s.basicSub")} />
        <div className="space-y-4 p-6">
          <Field label={t("mc.pf.f.email")} required>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t("mc.pf.f.emailPh")} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("mc.pf.f.brand")} required>
              <input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder={t("mc.pf.f.brandPh")} className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.contact")} required>
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder={t("mc.pf.f.contactPh")} className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("mc.pf.f.phone")} required>
              <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+237 ..." className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.city")} required>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder={t("mc.pf.f.cityPh")} className={inputCls} />
            </Field>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Tag} title={t("mc.pf.s.cat")} subtitle={t("mc.pf.s.catSub")} />
        <div className="p-6">
          <p className="text-sm font-medium text-slate-700">{t("mc.pf.f.mainCat")} <span className="text-rose-500">*</span></p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const active = form.category === c.value;
              return (
                <button type="button" key={c.value} onClick={() => set("category", c.value)} className={`not-pill rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand Details */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Building2} title={t("mc.pf.s.brand")} subtitle={t("mc.pf.s.brandSub")} />
        <div className="space-y-4 p-6">
          <Field label={t("mc.pf.f.desc")} required>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("mc.pf.f.descPh")} className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("mc.pf.f.support")} required>
              <input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@company.com" className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.web")} required>
              <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.ig")}>
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.fb")}>
              <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.wa")}>
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+237 ..." className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDrop label={t("mc.pf.f.logo")} hint={t("mc.pf.f.logoHint")} file={files.logo} onPick={(f) => setFiles((s) => ({ ...s, logo: f }))} />
            <FileDrop label={t("mc.pf.f.cover")} hint={t("mc.pf.f.coverHint")} file={files.cover} onPick={(f) => setFiles((s) => ({ ...s, cover: f }))} />
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Tag} title={t("mc.pf.s.offer")} subtitle={t("mc.pf.s.offerSub")} />
        <div className="space-y-4 p-6">
          <Field label={t("mc.pf.f.headline")} required hint={t("mc.pf.f.headlineHint")}>
            <input value={form.offerHeadline} onChange={(e) => set("offerHeadline", e.target.value)} placeholder={t("mc.pf.f.headlinePh")} className={inputCls} />
          </Field>
          <Field label={t("mc.pf.f.how")} required hint={t("mc.pf.f.howHint")}>
            <textarea rows={2} value={form.offerHowToUse} onChange={(e) => set("offerHowToUse", e.target.value)} placeholder={t("mc.pf.f.howPh")} className={inputCls} />
          </Field>
          <FileDrop label={t("mc.pf.f.product")} hint={t("mc.pf.f.productHint")} file={files.product} onPick={(f) => setFiles((s) => ({ ...s, product: f }))} />
          <Field label={t("mc.pf.f.redeem")} required>
            <div className="grid gap-2 sm:grid-cols-3">
              {REDEEM.map((rv) => {
                const active = form.offerRedeemable === rv;
                return (
                  <button type="button" key={rv} onClick={() => set("offerRedeemable", rv)} className={`not-pill rounded-lg border px-3 py-2.5 text-xs font-medium transition ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {t(`mc.pf.red.${rv}`)}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("mc.pf.f.terms")} required>
              <input value={form.offerTerms} onChange={(e) => set("offerTerms", e.target.value)} placeholder={t("mc.pf.f.termsPh")} className={inputCls} />
            </Field>
            <Field label={t("mc.pf.f.expiry")} required hint={t("mc.pf.f.expiryHint")}>
              <input type="date" min={minExpiry()} value={form.offerExpiry} onChange={(e) => set("offerExpiry", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Extra offers */}
          {extraOffers.map((o, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{t("mc.pf.x.n", { n: i + 2 })}</p>
                <button type="button" onClick={() => removeOffer(i)} className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={o.headline} onChange={(e) => setExtra(i, "headline", e.target.value)} placeholder={t("mc.pf.x.title")} className={inputCls} />
                <input type="date" value={o.expiry} onChange={(e) => setExtra(i, "expiry", e.target.value)} className={inputCls} />
              </div>
              <textarea rows={2} value={o.howToUse} onChange={(e) => setExtra(i, "howToUse", e.target.value)} placeholder={t("mc.pf.x.how")} className={`${inputCls} mt-3`} />
            </div>
          ))}
          <button type="button" onClick={addOffer} className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" /> {t("mc.pf.x.add")}
          </button>
        </div>
      </div>

      {/* Location on the partner map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={MapPin} title={t("mc.pf.s.loc")} subtitle={t("mc.pf.s.locSub")} />
        <div className="p-6">
          <LocationPicker value={place} onChange={setPlace} />
        </div>
      </div>

      {/* Countries */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Globe} title={t("mc.pf.s.countries")} subtitle={t("mc.pf.s.countriesSub")} />
        <div className="p-6">
          <AfricanCountrySelect value={form.countries} onChange={(v) => set("countries", v)} />
        </div>
      </div>

      {/* Terms confirmations */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Shield} title={t("mc.pf.s.terms")} subtitle={t("mc.pf.s.termsSub")} />
        <div className="space-y-3 p-6">
          {[
            { k: "multi" },
            { k: "twelve" },
            { k: "openAll" },
            { k: "better" },
          ].map((row) => (
            <label key={row.k} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
              <input type="checkbox" checked={tc[row.k]} onChange={(e) => setTc((s) => ({ ...s, [row.k]: e.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-slate-700">{t(`mc.pf.t.${row.k}`)} <span className="text-rose-500">*</span></span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={FileText} title={t("mc.pf.s.notes")} subtitle={t("mc.pf.s.notesSub")} />
        <div className="p-6">
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t("mc.pf.f.notesPh")} className={inputCls} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-70"
      >
        {busy ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? t("mc.pf.sending.files") : t("mc.pf.sending")}</>
        ) : (
          <><Sparkles className="h-5 w-5" /> {t("mc.pf.submit")}</>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        {t("mc.pf.help", { email: "partners@nelvinbenefits.com" }).split("partners@nelvinbenefits.com").flatMap((s, i, arr) => (i < arr.length - 1 ? [s, <a key={i} href="mailto:partners@nelvinbenefits.com" className="font-medium text-blue-600 hover:underline">partners@nelvinbenefits.com</a>] : [s]))}
      </p>
    </form>
  );
}