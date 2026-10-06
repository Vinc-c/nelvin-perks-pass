import React, { useEffect, useMemo, useState } from "react";
import { invokeFunction } from "@/api/functions";
import { uploadPublicFile } from "@/api/storage";
import { Check, X, Loader2 } from "lucide-react";
import AfricanCountrySelect from "./AfricanCountrySelect";
import LocationPicker from "@/components/map/LocationPicker";
import Motif from "@/components/brand/Motif";
import { useCategories } from "@/hooks/useCategories";

const REDEEM = [
  { v: "OFFLINE", l: "En boutique" },
  { v: "ONLINE", l: "Sur mon site" },
  { v: "BOTH", l: "Les deux" },
];

const TERMS = [
  { k: "multi", t: "Un membre peut utiliser l'offre plusieurs fois sur une période convenue." },
  { k: "twelve", t: "L'offre reste valable au moins 12 mois." },
  { k: "openAll", t: "L'offre est ouverte à tous les membres, pas seulement aux nouveaux clients." },
  { k: "better", t: "L'offre est plus avantageuse que vos promotions publiques." },
];

function Step({ n, title, hint, children }) {
  return (
    <section className="grid gap-5 border-t border-slate-200 py-8 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <p className="nv-display text-3xl font-semibold text-[#D4A13A]">{n}</p>
        <h2 className="nv-display mt-2 text-lg font-semibold text-[#0E1A3B]">{title}</h2>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">
        {label} {required && <span className="text-[#9C4A2F]" aria-hidden>*</span>}
      </span>
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0E1A3B] focus:ring-2 focus:ring-[#0E1A3B]/10";

function FileDrop({ label, hint, file, onPick }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label} <span className="text-[#9C4A2F]" aria-hidden>*</span></span>
      <span className="block text-xs text-slate-500">{hint}</span>
      <span className="nv-focus mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-[#0E1A3B]">
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] || null)} />
        {preview
          ? <img src={preview} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          : <span className="h-14 w-14 shrink-0 rounded-lg bg-[repeating-linear-gradient(45deg,#EEF1F7_0_6px,#fff_6px_12px)] ring-1 ring-slate-200" />}
        <span className="min-w-0 text-sm">
          <span className="block truncate font-medium text-slate-800">{file ? file.name : "Choisir une image"}</span>
          <span className="block text-xs text-slate-500">PNG, JPG ou WebP, 10 Mo maximum</span>
        </span>
      </span>
    </label>
  );
}

export default function PartnerApplicationForm({ onSubmitted }) {
  const [form, setForm] = useState({
    brandType: "new",
    email: "", brandName: "", contactName: "", contactPhone: "", city: "",
    category: "",
    description: "", supportEmail: "", website: "", instagram: "", facebook: "", whatsapp: "",
    offerHeadline: "", offerHowToUse: "", offerRedeemable: "OFFLINE", offerTerms: "", offerExpiry: "",
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
  const inStore = form.offerRedeemable !== "ONLINE";

  const addOffer = () => setExtraOffers((o) => [...o, { headline: "", howToUse: "", redeemable: "BOTH", terms: "", expiry: "" }]);
  const removeOffer = (i) => setExtraOffers((o) => o.filter((_, idx) => idx !== i));
  const setExtra = (i, k, v) => setExtraOffers((o) => o.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.brandName || !form.contactName || !form.contactPhone || !form.city)
      return setError("Complétez vos coordonnées : e-mail, nom du commerce, contact, téléphone et ville.");
    if (!form.category) return setError("Choisissez la catégorie de votre commerce.");
    if (!form.description || !form.supportEmail || !form.website)
      return setError("Complétez la présentation : description, e-mail du service client et site web.");
    if (!files.logo || !files.cover || !files.product)
      return setError("Ajoutez votre logo, une image de couverture et une photo de vos produits ou services.");
    if (!form.offerHeadline || !form.offerHowToUse || !form.offerExpiry)
      return setError("Complétez l'offre : titre, mode d'utilisation et date de fin.");
    if (inStore && (place.lat == null || place.lng == null))
      return setError("Placez votre commerce sur la carte pour que les membres puissent vous trouver.");
    if (form.countries.length === 0) return setError("Choisissez au moins un pays.");
    if (!tc.multi || !tc.twelve || !tc.openAll || !tc.better)
      return setError("Confirmez les quatre engagements partenaires.");

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
          extraOffers.map((o, i) => `#${i + 2}: ${o.headline} | utilisation : ${o.howToUse} | fin : ${o.expiry}`).join("\n")
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
        notes: (form.brandType === "existing" ? "[Commerce déjà référencé] " : "") + (form.notes || "") + extraText,
        termsConfirmed: [tc.multi, tc.twelve, tc.openAll, tc.better],
      });

      if (res.data?.error) return setError(res.data.error);
      if (onSubmitted) { onSubmitted(); return; }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
        <h2 className="nv-display text-2xl font-semibold text-[#0E1A3B]">Candidature envoyée</h2>
        <p className="mt-3 text-sm text-slate-600">
          Merci. L'équipe partenaires étudie votre dossier et vous contacte par e-mail sous 2 à 3 jours ouvrés.
        </p>
        <a href="/" className="nv-focus mt-6 inline-flex rounded-full bg-[#0E1A3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#27306E]">
          Retour à l'accueil
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="nv-body rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-10">
      <Step n="1" title="Vos coordonnées" hint="Pour vous recontacter au sujet du dossier.">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Statut du commerce</legend>
          {[
            { v: "new", t: "Première candidature" },
            { v: "existing", t: "Déjà partenaire Nelvin" },
          ].map((o) => (
            <label key={o.v} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm font-medium transition ${form.brandType === o.v ? "border-[#0E1A3B] bg-[#EEF1F7] text-[#0E1A3B]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              <input type="radio" name="brandType" value={o.v} checked={form.brandType === o.v} onChange={() => set("brandType", o.v)} className="accent-[#0E1A3B]" />
              {o.t}
            </label>
          ))}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du commerce" required>
            <input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="Ex. Chez Wou" className={inputCls} />
          </Field>
          <Field label="E-mail" required>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vous@commerce.com" className={inputCls} />
          </Field>
          <Field label="Personne à contacter" required>
            <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Prénom et nom" className={inputCls} />
          </Field>
          <Field label="Téléphone" required>
            <input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+237 6 …" className={inputCls} />
          </Field>
          <Field label="Ville" required>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex. Douala" className={inputCls} />
          </Field>
        </div>
      </Step>

      <Step n="2" title="Votre activité" hint="La catégorie sous laquelle les membres vous trouveront.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Catégorie">
          {categories.map((c) => {
            const active = form.category === c.value;
            return (
              <button type="button" role="radio" aria-checked={active} key={c.value} onClick={() => set("category", c.value)}
                className={`nv-focus not-pill flex items-center gap-2.5 rounded-lg border p-2 text-left text-sm font-medium transition ${active ? "border-[#0E1A3B] bg-[#EEF1F7] text-[#0E1A3B]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                <Motif category={c.value} className="h-7 w-7 shrink-0" rounded="rounded-md" />
                {c.label}
              </button>
            );
          })}
        </div>
        <Field label="Présentation du commerce" required>
          <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ce que vous proposez, votre spécialité, votre ambiance" className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail du service client" required>
            <input type="email" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} placeholder="contact@commerce.com" className={inputCls} />
          </Field>
          <Field label="Site web ou page principale" required>
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
          <Field label="WhatsApp Business">
            <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+237 6 …" className={inputCls} />
          </Field>
          <Field label="Instagram">
            <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" className={inputCls} />
          </Field>
          <Field label="Facebook">
            <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FileDrop label="Logo" hint="Carré, 800 × 800 px" file={files.logo} onPick={(f) => setFiles((s) => ({ ...s, logo: f }))} />
          <FileDrop label="Image de couverture" hint="Bannière de votre page, 1200 × 600 px" file={files.cover} onPick={(f) => setFiles((s) => ({ ...s, cover: f }))} />
        </div>
      </Step>

      <Step n="3" title="Votre offre membre" hint="Ce que les membres Nelvin obtiennent chez vous.">
        <Field label="Titre de l'offre" required hint="Ex. 20 % sur l'addition, du lundi au jeudi">
          <input value={form.offerHeadline} onChange={(e) => set("offerHeadline", e.target.value)} placeholder="20 % sur l'addition" className={inputCls} />
        </Field>
        <Field label="Comment l'utiliser" required hint="Ex. Montrez votre pass Nelvin en caisse avant de payer">
          <textarea rows={2} value={form.offerHowToUse} onChange={(e) => set("offerHowToUse", e.target.value)} className={inputCls} />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-slate-800">Où l'offre s'utilise <span className="text-[#9C4A2F]" aria-hidden>*</span></legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {REDEEM.map((r) => (
              <label key={r.v} className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition ${form.offerRedeemable === r.v ? "border-[#0E1A3B] bg-[#EEF1F7] text-[#0E1A3B]" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                <input type="radio" name="redeem" className="sr-only" checked={form.offerRedeemable === r.v} onChange={() => set("offerRedeemable", r.v)} />
                {r.l}
              </label>
            ))}
          </div>
        </fieldset>
        <FileDrop label="Photo de vos produits ou services" hint="1440 × 810 px, sans texte sur l'image" file={files.product} onPick={(f) => setFiles((s) => ({ ...s, product: f }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Conditions particulières" hint="Ex. Hors boissons, plafonné à 10 000 FCFA">
            <input value={form.offerTerms} onChange={(e) => set("offerTerms", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Date de fin" required hint="Au moins 12 mois de validité">
            <input type="date" value={form.offerExpiry} onChange={(e) => set("offerExpiry", e.target.value)} className={inputCls} />
          </Field>
        </div>
        {extraOffers.map((o, i) => (
          <div key={i} className="rounded-xl bg-[#EEF1F7] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0E1A3B]">Offre supplémentaire {i + 2}</p>
              <button type="button" onClick={() => removeOffer(i)} aria-label={`Retirer l'offre ${i + 2}`} className="nv-focus rounded-full p-1 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={o.headline} onChange={(e) => setExtra(i, "headline", e.target.value)} placeholder="Titre de l'offre" aria-label="Titre de l'offre" className={inputCls} />
              <input type="date" value={o.expiry} onChange={(e) => setExtra(i, "expiry", e.target.value)} aria-label="Date de fin" className={inputCls} />
            </div>
            <textarea rows={2} value={o.howToUse} onChange={(e) => setExtra(i, "howToUse", e.target.value)} placeholder="Comment l'utiliser" aria-label="Comment l'utiliser" className={`${inputCls} mt-3`} />
          </div>
        ))}
        <button type="button" onClick={addOffer} className="nv-focus rounded-full px-4 py-2 text-sm font-semibold text-[#0E1A3B] ring-1 ring-slate-300 hover:bg-slate-50">
          Ajouter une autre offre
        </button>
      </Step>

      <Step n="4" title="Où vous trouver" hint={inStore ? "Votre commerce apparaîtra sur la carte des partenaires." : "Facultatif pour une offre uniquement en ligne."}>
        <LocationPicker value={place} onChange={setPlace} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-800">Pays où l'offre est valable <span className="text-[#9C4A2F]" aria-hidden>*</span></p>
          <AfricanCountrySelect value={form.countries} onChange={(v) => set("countries", v)} />
        </div>
      </Step>

      <Step n="5" title="Engagements" hint="Ce qui fait la valeur du pass pour les membres.">
        <div className="space-y-1">
          {TERMS.map((row) => (
            <label key={row.k} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
              <input type="checkbox" checked={tc[row.k]} onChange={(e) => setTc((s) => ({ ...s, [row.k]: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded accent-[#0E1A3B]" />
              <span className="text-sm text-slate-700">{row.t}</span>
            </label>
          ))}
        </div>
        <Field label="Autre chose à nous dire ?">
          <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ex. plusieurs adresses, codes uniques pour la vente en ligne" className={inputCls} />
        </Field>
      </Step>

      {error && <p role="alert" className="mb-4 rounded-xl bg-[#9C4A2F]/10 px-4 py-3 text-sm text-[#9C4A2F]">{error}</p>}

      <button type="submit" disabled={busy}
        className="nv-focus flex w-full items-center justify-center gap-2 rounded-full bg-[#0E1A3B] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#27306E] disabled:opacity-70">
        {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? "Envoi des images…" : "Envoi du dossier…"}</> : <><Check className="h-5 w-5" /> Envoyer ma candidature</>}
      </button>
      <p className="mt-4 text-center text-sm text-slate-500">
        Une question ? Écrivez-nous à <a href="mailto:partners@nelvinbenefits.com" className="font-medium text-[#0E1A3B] underline underline-offset-4">partners@nelvinbenefits.com</a>
      </p>
    </form>
  );
}
