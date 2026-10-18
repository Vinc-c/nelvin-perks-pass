// Partner (merchant) application. The applicant must be signed in: the new
// PENDING merchant is linked to their account (so they can follow the review,
// upload KYC documents and reach the dashboard once validated) and the account
// becomes a MERCHANT. Accounts tied to a company (employees, HR) are refused:
// they would lose their role, so a separate merchant account is required.
import { adminClient, getCaller, isAdminRole, json, readJson, serve } from "../_shared/http.ts";

const CATEGORIES = [
  "FOOD_DINING", "TRAVEL_HOLIDAYS", "HOTELS_HOSPITALITY", "FITNESS_SPORTS", "WELLNESS_MENTAL", "HEALTHCARE",
  "FINANCIAL_WELLNESS", "SHOPPING_RETAIL", "TECHNOLOGY", "FAMILY_PARENTING", "EDUCATION_LEARNING",
  "HOME_LIVING", "AUTOMOTIVE_MOBILITY", "BEAUTY_CARE", "ENTERTAINMENT",
];
const REQUIRED = [
  "email", "brandName", "contactName", "contactPhone", "description", "supportEmail", "website",
  "logoUrl", "coverUrl", "offerHeadline", "offerHowToUse", "productUrl", "offerRedeemable", "offerExpiry",
  "category", "countries",
];
const str = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Connectez-vous ou créez un compte marchand pour déposer votre candidature." }, 401);
  if (!isAdminRole(caller.profile.role) && (caller.profile.role === "HR_ADMIN" || caller.profile.role === "EMPLOYEE" || caller.profile.company_id)) {
    return json({ error: "Ce compte est rattaché à une entreprise. Créez un compte marchand distinct pour devenir partenaire." }, 409);
  }

  const data = await readJson(req);
  for (const f of REQUIRED) {
    if (!data[f]) return json({ error: `Champ obligatoire manquant : ${f}` }, 400);
  }
  const countries = Array.isArray(data.countries) ? data.countries.map((c) => str(c, 80)).filter(Boolean) : [];
  if (countries.length === 0) return json({ error: "Sélectionnez au moins un pays." }, 400);
  const terms = Array.isArray(data.termsConfirmed) ? data.termsConfirmed : [];
  if (terms.filter(Boolean).length < 4) return json({ error: "Confirmez toutes les conditions générales." }, 400);
  if (String(data.brandName).length > 120 || String(data.description).length > 2000) {
    return json({ error: "Texte trop long (nom : 120 caractères, description : 2000)." }, 400);
  }
  const category = str(data.category, 40);
  if (!CATEGORIES.includes(category)) return json({ error: "Catégorie invalide." }, 400);
  const redeemable = ["ONLINE", "OFFLINE", "BOTH"].includes(String(data.offerRedeemable)) ? String(data.offerRedeemable) : "BOTH";
  const expiry = /^\d{4}-\d{2}-\d{2}$/.test(String(data.offerExpiry)) ? String(data.offerExpiry) : null;

  // Optional shop position picked on the map; must fall on the African continent.
  const lat = Number(data.lat), lng = Number(data.lng);
  const located = data.lat != null && data.lng != null && Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -40 && lat <= 40 && lng >= -30 && lng <= 65;

  // An applicant who already owns a brand cannot create a second one.
  if (caller.profile.merchant_id && !isAdminRole(caller.profile.role)) {
    return json({ error: "Votre compte est déjà lié à une marque partenaire." }, 409);
  }

  const { data: merchant, error } = await admin
    .from("merchants")
    .insert({
      name: str(data.brandName, 120),
      category,
      country: countries[0],
      city: str(data.city, 80),
      address: str(data.address, 200),
      lat: located ? Math.round(lat * 1e6) / 1e6 : null,
      lng: located ? Math.round(lng * 1e6) / 1e6 : null,
      logo_url: str(data.logoUrl, 1000),
      cover_image_url: str(data.coverUrl, 1000),
      contact_email: str(data.email, 200),
      contact_name: str(data.contactName, 120),
      contact_phone: str(data.contactPhone, 40),
      description: str(data.description, 2000),
      website: str(data.website, 300),
      instagram: str(data.instagram, 300),
      facebook: str(data.facebook, 300),
      whatsapp: str(data.whatsapp, 60),
      offer_headline: str(data.offerHeadline, 300),
      offer_how_to_use: str(data.offerHowToUse, 2000),
      product_image_url: str(data.productUrl, 1000),
      offer_redeemable: redeemable,
      offer_terms: str(data.offerTerms, 4000),
      offer_expiry: expiry,
      offer_countries: countries.join(", "),
      application_notes: str(data.notes, 6000),
      verified_status: "PENDING",
      created_by_id: caller.user.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (!caller.profile.merchant_id) {
    const isAdmin = isAdminRole(caller.profile.role);
    await admin
      .from("profiles")
      .update({
        merchant_id: merchant.id,
        ...(isAdmin ? {} : { role: "MERCHANT", account_type: "marchand", onboarded: true }),
      })
      .eq("id", caller.user.id);
  }

  return json({ ok: true, merchantId: merchant.id });
});
