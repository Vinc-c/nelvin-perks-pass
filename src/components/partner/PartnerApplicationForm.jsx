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
  { v: "ONLINE", l: "En ligne, via mon site" },
  { v: "OFFLINE", l: "En personne, dans mes points de vente" },
  { v: "BOTH", l: "En ligne et en point de vente" },
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
            Glissez un fichier ou parcourez
            <span className="mt-1 block text-xs">PNG, JPG, WebP, 10 Mo max</span>
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
      return setError("Complétez tous les champs obligatoires des informations de base.");
    if (!form.category) return setError("Sélectionnez la catégorie de votre marque.");
    if (!form.description || !form.supportEmail || !form.website)
      return setError("Complétez tous les champs obligatoires du détail de la marque.");
    if (!files.logo || !files.cover || !files.product)
      return setError("Téléversez le logo, l'image de couverture et l'image produit de votre marque.");
    if (!form.offerHeadline || !form.offerHowToUse || !form.offerExpiry)
      return setError("Complétez tous les champs obligatoires de l'offre.");
    if (form.offerExpiry < minExpiry())
      return setError("L'offre doit être valable au moins 12 mois : choisissez une date d'expiration plus lointaine.");
    if (form.offerRedeemable !== "ONLINE" && (place.lat == null || place.lng == null))
      return setError("Placez votre commerce sur la carte pour que les membres puissent vous trouver.");
    if (form.countries.length === 0) return setError("Sélectionnez au moins un pays.");
    if (!tc.multi || !tc.twelve || !tc.openAll || !tc.better)
      return setError("Confirmez toutes les conditions générales.");

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
        ? "\n\nOffres supplémentaires :\n" +
          extraOffers
            .map((o, i) => `#${i + 2}: ${o.headline} | mode d'emploi : ${o.howToUse} | utilisation : ${o.redeemable} | conditions : ${o.terms} | expiration : ${o.expiry}`)
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
      setError(err.message || "Envoi impossible. Réessayez.");
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
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Candidature envoyée</h2>
        <p className="mt-2 text-sm text-slate-500">
          Merci ! Votre marque est en cours d'examen. Notre équipe partenariats vous répond sous 2 à 3 jours ouvrés. En attendant, vous pouvez déposer vos documents de vérification (KYC).
        </p>
        {/* Plain links (full reload): the account just became a MERCHANT server-side. */}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/kyc-verification" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Envoyer mes documents KYC
          </a>
          <a href="/merchant-dashboard" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Suivre ma candidature
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">

      {/* Basic Information */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={User} title="Informations de base" subtitle="Parlez-nous de vous" />
        <div className="space-y-4 p-6">
          <Field label="Votre adresse email" required>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vous@entreprise.com" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de votre marque" required>
              <input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Nom de la marque" className={inputCls} />
            </Field>
            <Field label="Nom de la personne de contact" required>
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Nom complet" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Numéro de la personne de contact" required>
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
        <SectionHeader icon={Building2} title="Votre marque" subtitle="Présentez votre marque" />
        <div className="space-y-4 p-6">
          <Field label="Courte description de votre entreprise" required>
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Quelques phrases sur votre activité" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email du support client" required>
              <input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="support@company.com" className={inputCls} />
            </Field>
            <Field label="Site web" required>
              <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="Lien Instagram">
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="Lien Facebook">
              <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://" className={inputCls} />
            </Field>
            <Field label="Numéro WhatsApp">
              <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+237 ..." className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDrop label="Logo de la marque (800x800 px, 10 Mo max)" hint="PNG, JPG, WebP" file={files.logo} onPick={(f) => setFiles((s) => ({ ...s, logo: f }))} />
            <FileDrop label="Image de couverture (1200x600 px, 10 Mo max)" hint="Bannière de la page de votre marque" file={files.cover} onPick={(f) => setFiles((s) => ({ ...s, cover: f }))} />
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Tag} title="Votre offre" subtitle="Présentez votre offre aux membres" />
        <div className="space-y-4 p-6">
          <Field label="Titre de votre offre" required hint="Exemple : -20 % sur votre addition en boutique">
            <input value={form.offerHeadline} onChange={(e) => set("offerHeadline", e.target.value)} placeholder="-20 % sur votre addition en boutique" className={inputCls} />
          </Field>
          <Field label="Comment utiliser l'offre ?" required hint="Exemple : 1. Présentez votre pass Nelvin 2. Donnez le code en caisse">
            <textarea rows={2} value={form.offerHowToUse} onChange={(e) => set("offerHowToUse", e.target.value)} placeholder="1. Présentez votre pass 2. Donnez le code en caisse" className={inputCls} />
          </Field>
          <FileDrop label="Image du produit / service (1440x810 px)" hint="Aucun texte ne doit apparaître sur l'image" file={files.product} onPick={(f) => setFiles((s) => ({ ...s, product: f }))} />
          <Field label="L'offre est-elle valable en ligne / en point de vente ?" required>
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
            <Field label="Conditions particulières ?" required>
              <input value={form.offerTerms} onChange={(e) => set("offerTerms", e.target.value)} placeholder="Plafond de 50 $ par commande" className={inputCls} />
            </Field>
            <Field label="Date d'expiration de l'offre" required hint="Validité minimale de 12 mois">
              <input type="date" min={minExpiry()} value={form.offerExpiry} onChange={(e) => set("offerExpiry", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Extra offers */}
          {extraOffers.map((o, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Offre supplémentaire n°{i + 2}</p>
                <button type="button" onClick={() => removeOffer(i)} className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={o.headline} onChange={(e) => setExtra(i, "headline", e.target.value)} placeholder="Titre de l'offre" className={inputCls} />
                <input type="date" value={o.expiry} onChange={(e) => setExtra(i, "expiry", e.target.value)} className={inputCls} />
              </div>
              <textarea rows={2} value={o.howToUse} onChange={(e) => setExtra(i, "howToUse", e.target.value)} placeholder="Comment utiliser l'offre" className={`${inputCls} mt-3`} />
            </div>
          ))}
          <button type="button" onClick={addOffer} className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" /> Add Another Offer
          </button>
        </div>
      </div>

      {/* Location on the partner map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={MapPin} title="Localisation" subtitle="Où les membres vous trouveront sur la carte des partenaires" />
        <div className="p-6">
          <LocationPicker value={place} onChange={setPlace} lang="en" />
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
        <SectionHeader icon={Shield} title="Conditions Nelvin" subtitle="Confirmez les exigences suivantes" />
        <div className="space-y-3 p-6">
          {[
            { k: "multi", t: "L'offre peut être utilisée plusieurs fois sur une période convenue." },
            { k: "twelve", t: "L'offre est valable au moins 12 mois." },
            { k: "openAll", t: "L'offre est ouverte à tous les membres, pas seulement aux nouveaux clients." },
            { k: "better", t: "L'offre est meilleure que ce qui est affiché publiquement." },
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
        <SectionHeader icon={FileText} title="Notes complémentaires" subtitle="Toute autre information utile" />
        <div className="p-6">
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ex. : codes uniques, horaires, jours exclus" className={inputCls} />
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
          <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? "Envoi des fichiers…" : "Envoi de la candidature…"}</>
        ) : (
          <><Sparkles className="h-5 w-5" /> Envoyer ma candidature</>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        Besoin d'aide ? Écrivez-nous à <a href="mailto:partners@nelvinbenefits.com" className="font-medium text-blue-600 hover:underline">partners@nelvinbenefits.com</a>
      </p>
    </form>
  );
}