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

const REDEEM = [
  { v: "ONLINE", l: "Online via my website" },
  { v: "OFFLINE", l: "In person / at my physical locations" },
  { v: "BOTH", l: "Both online and in physical locations" },
];

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
            Drag & drop a file or browse
            <span className="mt-1 block text-xs">PNG, JPG, WebP up to 10MB</span>
          </div>
        )}
      </div>
    </label>
  );
}

export default function PartnerApplicationForm({ onSubmitted }) {
  const [form, setForm] = useState({
    brandType: "new",
    email: "", brandName: "", contactName: "", contactPhone: "", city: "",
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
  const toggleCountry = (c) =>
    setForm((f) => ({
      ...f,
      countries: f.countries.includes(c) ? f.countries.filter((x) => x !== c) : [...f.countries, c],
    }));

  const addOffer = () =>
    setExtraOffers((o) => [...o, { headline: "", howToUse: "", redeemable: "BOTH", terms: "", expiry: "" }]);
  const removeOffer = (i) => setExtraOffers((o) => o.filter((_, idx) => idx !== i));
  const setExtra = (i, k, v) =>
    setExtraOffers((o) => o.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.brandName || !form.contactName || !form.contactPhone || !form.city)
      return setError("Please complete all required Basic Information fields.");
    if (!form.category) return setError("Please select your brand category.");
    if (!form.description || !form.supportEmail || !form.website)
      return setError("Please complete all required Brand Details fields.");
    if (!files.logo || !files.cover || !files.product)
      return setError("Please upload your brand logo, cover image and product image.");
    if (!form.offerHeadline || !form.offerHowToUse || !form.offerExpiry)
      return setError("Please complete all required Offer Details fields.");
    if (form.offerRedeemable !== "ONLINE" && (place.lat == null || place.lng == null))
      return setError("Please place your shop on the map so members can find you.");
    if (form.countries.length === 0) return setError("Please select at least one country.");
    if (!tc.multi || !tc.twelve || !tc.openAll || !tc.better)
      return setError("Please confirm all Terms & Conditions.");

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
            .map((o, i) => `#${i + 2}: ${o.headline} | how: ${o.howToUse} | redeem: ${o.redeemable} | terms: ${o.terms} | exp: ${o.expiry}`)
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
      setError(err.message || "Submission failed. Please try again.");
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
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Application submitted</h2>
        <p className="mt-2 text-sm text-slate-500">
          Thank you! Your brand has been submitted for review. Our partnerships team will reach out within 2–3 business days.
        </p>
        <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Back to home
        </a>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      {/* New / Existing brand */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Are you a new brand or already listed on Nelvin?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { v: "new", t: "New Brand", s: "I'm applying for the first time" },
            { v: "existing", t: "Existing Brand", s: "I'm already on Nelvin" },
          ].map((o) => {
            const active = form.brandType === o.v;
            return (
              <button
                type="button"
                key={o.v}
                onClick={() => set("brandType", o.v)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                  active ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-blue-500" : "border-slate-300"}`}>
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">{o.t}</span>
                  <span className="block text-xs text-slate-500">{o.s}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Basic Information */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={User} title="Basic Information" subtitle="Tell us about yourself" />
        <div className="space-y-4 p-6">
          <Field label="What is your email address?" required>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What is your brand name?" required>
              <input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Your Brand Name" className={inputCls} />
            </Field>
            <Field label="Contact person name" required>
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Full name" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person number" required>
              <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+237 ..." className={inputCls} />
            </Field>
            <Field label="Ville" required>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex. Douala" className={inputCls} />
            </Field>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Tag} title="Catégorie" subtitle="Dans quelle catégorie se situe votre marque ?" />
        <div className="p-6">
          <p className="text-sm font-medium text-slate-700">Sélectionnez votre catégorie principale <span className="text-rose-500">*</span></p>
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
        <SectionHeader icon={Building2} title="Brand Details" subtitle="Tell us about your brand" />
        <div className="space-y-4 p-6">
          <Field label="Short description of your company" required>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="A few sentences about what you do" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support Contact Email" required>
              <input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@company.com" className={inputCls} />
            </Field>
            <Field label="Website Link" required>
              <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="Instagram Link">
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="Facebook Link">
              <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="WhatsApp Number">
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+237 ..." className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDrop label="Brand Logo (800x800px, max 10mb)" hint="PNG, JPG, WebP" file={files.logo} onPick={(f) => setFiles((s) => ({ ...s, logo: f }))} />
            <FileDrop label="Cover Image (1200x600px, max 10mb)" hint="Used as the banner on your brand page" file={files.cover} onPick={(f) => setFiles((s) => ({ ...s, cover: f }))} />
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Tag} title="Offer Details" subtitle="Tell us about your offer" />
        <div className="space-y-4 p-6">
          <Field label="What would you like the headline of your offer to be?" required hint="Example: Save 20% off your order in-store">
            <input value={form.offerHeadline} onChange={(e) => set("offerHeadline", e.target.value)} placeholder="Save 20% off your order in-store" className={inputCls} />
          </Field>
          <Field label="How do you use the offer?" required hint="Example: 1. Copy code 2. Open website 3. Paste code in the discount box">
            <textarea rows={2} value={form.offerHowToUse} onChange={(e) => set("offerHowToUse", e.target.value)} placeholder="1. Copy code 2. Open website 3. Paste code" className={inputCls} />
          </Field>
          <FileDrop label="Product / Service Image (1440x810px)" hint="No text should be visible in the image" file={files.product} onPick={(f) => setFiles((s) => ({ ...s, product: f }))} />
          <Field label="Is the offer redeemable online / offline?" required>
            <div className="grid gap-2 sm:grid-cols-3">
              {REDEEM.map((r) => {
                const active = form.offerRedeemable === r.v;
                return (
                  <button type="button" key={r.v} onClick={() => set("offerRedeemable", r.v)} className={`not-pill rounded-lg border px-3 py-2.5 text-xs font-medium transition ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {r.l}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Are there any Terms & Conditions?" required>
              <input value={form.offerTerms} onChange={(e) => set("offerTerms", e.target.value)} placeholder="Maximum cap of $50 per order" className={inputCls} />
            </Field>
            <Field label="When does the offer expire?" required hint="Minimum 12 months validity">
              <input type="date" value={form.offerExpiry} onChange={(e) => set("offerExpiry", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Extra offers */}
          {extraOffers.map((o, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Additional offer #{i + 2}</p>
                <button type="button" onClick={() => removeOffer(i)} className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={o.headline} onChange={(e) => setExtra(i, "headline", e.target.value)} placeholder="Offer headline" className={inputCls} />
                <input type="date" value={o.expiry} onChange={(e) => setExtra(i, "expiry", e.target.value)} className={inputCls} />
              </div>
              <textarea rows={2} value={o.howToUse} onChange={(e) => setExtra(i, "howToUse", e.target.value)} placeholder="How to use the offer" className={`${inputCls} mt-3`} />
            </div>
          ))}
          <button type="button" onClick={addOffer} className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" /> Add Another Offer
          </button>
        </div>
      </div>

      {/* Location on the partner map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={MapPin} title="Location" subtitle="Where members will find you on the partner map" />
        <div className="p-6">
          <LocationPicker value={place} onChange={setPlace} />
        </div>
      </div>

      {/* Countries */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Globe} title="Pays" subtitle="Où vos offres sont-elles valables ? (Afrique uniquement)" />
        <div className="p-6">
          <AfricanCountrySelect value={form.countries} onChange={(v) => set("countries", v)} />
        </div>
      </div>

      {/* Terms confirmations */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Shield} title="Terms & Conditions for Nelvin" subtitle="Please confirm the following requirements" />
        <div className="space-y-3 p-6">
          {[
            { k: "multi", t: "The offer may be used more than one time within an agreed period." },
            { k: "twelve", t: "The offer has a minimum of 12 months validity." },
            { k: "openAll", t: "This offer is open to all users, not first time only." },
            { k: "better", t: "The offer is better than what is currently publicly advertised." },
          ].map((row) => (
            <label key={row.k} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
              <input type="checkbox" checked={tc[row.k]} onChange={(e) => setTc((s) => ({ ...s, [row.k]: e.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-slate-700">{row.t} <span className="text-rose-500">*</span></span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={FileText} title="Additional Notes" subtitle="Any other information you'd like to share" />
        <div className="p-6">
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Example: Unique Codes" className={inputCls} />
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
          <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? "Uploading files..." : "Submitting..."}</>
        ) : (
          <><Sparkles className="h-5 w-5" /> Submit Application</>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        Need help? Contact us at <a href="mailto:partners@nelvinbenefits.com" className="font-medium text-blue-600 hover:underline">partners@nelvinbenefits.com</a>
      </p>
    </form>
  );
}