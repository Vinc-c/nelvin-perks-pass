import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import QrRedemption from "@/components/QrRedemption";
import PinRedemption from "@/components/PinRedemption";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import OfferReviews, { Stars } from "@/components/OfferReviews";
import { callRpc } from "@/api/rpc";
import { Image } from "@/components/ui/image";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { offerBadge } from "@/hooks/useCatalog";
import { categoryImage } from "@/data/offerCategories";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/lib/AuthContext";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { MapPin, Clock, ShieldCheck, ArrowLeft, Tag, Wallet, Globe, Instagram, Phone, KeyRound, Repeat, MessageCircle, Gift } from "lucide-react";

const PERIOD = { DAY: "par jour", WEEK: "par semaine", MONTH: "par mois", YEAR: "par an", LIFETIME: "au total" };
const AUDIENCE = { B2C: "Membres Pass", B2B_ONLY: "Salariés d'entreprises clientes", ALL: "Tous les membres" };

export default function OfferDetails() {
  const [params] = useSearchParams();
  const { slug } = useParams();
  const id = params.get("id");
  const { user } = useAuth();
  const { meta } = useCategories();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [redeem, setRedeem] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    if (!id && !slug) return null;
    const offer = id
      ? await entities.Offer.get(id).catch(() => null)
      : (await entities.Offer.filter({ slug }, "-created_date", 1).catch(() => []))[0] || null;
    if (!offer) return null;
    const merchant = await entities.Merchant.get(offer.merchant_id).catch(() => null);
    let usage = null;
    let usedOnce = false;
    if (user?.id) {
      const [u, mine] = await Promise.all([
        callRpc("my_offer_usage", { p_offer_ids: [offer.id] }).catch(() => []),
        entities.Redemption.filter({ offer_id: offer.id, user_id: user.id, status: "REDEEMED" }, "-redeemed_at", 1).catch(() => []),
      ]);
      usage = u?.[0] || null;
      usedOnce = mine.length > 0;
    }
    return { offer, merchant, usage, usedOnce };
  }, [id, slug, user?.id]);

  const seoOffer = data?.offer;
  const seoMerchant = data?.merchant;
  const seoBadge = seoOffer ? offerBadge(seoOffer, (v) => money.format(v, currency)) : "";
  const seoTitle = seoOffer ? (seoOffer.seo_title || `${seoOffer.title}${seoMerchant ? ` — ${seoMerchant.name}` : ""} | Nelvin`) : "";
  const seoDesc = seoOffer ? (seoOffer.seo_description || `${seoBadge}${seoMerchant?.city ? ` à ${seoMerchant.city}` : ""} avec le Pass Nelvin. ${seoOffer.description || ""}`.trim().slice(0, 200)) : "";
  const seoPath = seoOffer ? `/offre/${seoOffer.slug || ""}` : undefined;
  const seoImage = seoOffer ? (seoOffer.image_url || seoMerchant?.cover_image_url || undefined) : undefined;
  useSeo({
    title: seoTitle,
    description: seoDesc,
    image: seoImage,
    path: seoOffer?.slug ? seoPath : undefined,
    jsonLd: seoOffer && {
      "@context": "https://schema.org",
      "@type": "Offer",
      name: seoOffer.title,
      description: seoDesc,
      image: seoImage,
      priceValidUntil: seoOffer.expires_at || undefined,
      seller: seoMerchant ? {
        "@type": "LocalBusiness",
        name: seoMerchant.name,
        image: seoMerchant.logo_url || undefined,
        address: { "@type": "PostalAddress", addressLocality: seoMerchant.city || undefined, addressCountry: seoMerchant.country || undefined, streetAddress: seoMerchant.address || undefined },
        ...(seoMerchant.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: seoMerchant.lat, longitude: seoMerchant.lng } } : {}),
      } : undefined,
    },
  });

  if (loading) return <PortalLayout title="Offre" theme="light"><Spinner /></PortalLayout>;
  if (!data) {
    return (
      <PortalLayout title="Offre" theme="light">
        <EmptyState icon={Tag} title="Offre introuvable" description="Cette offre a expiré ou n'est plus disponible." action={<Link to="/merchant-directory" className="text-sm font-medium text-emerald-600 hover:underline">Voir les partenaires</Link>} />
      </PortalLayout>
    );
  }

  const { offer, merchant, usage, usedOnce } = data;
  const limitReached = usage?.remaining === 0;
  const expired = offer.expires_at && new Date(offer.expires_at) < new Date();
  const employeesOnly = offer.target_audience === "B2B_ONLY" && !user?.company_id;
  const canRedeem = user && !expired && !employeesOnly && !limitReached && merchant?.verified_status === "VERIFIED";
  const cat = meta(offer.category);

  return (
    <PortalLayout title="Offre" theme="light">
      <Link to="/merchant-directory" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> Retour aux partenaires
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="relative h-56">
            <Image src={offer.image_url || merchant?.cover_image_url || cat.image_url || categoryImage(offer.category)} alt={offer.title} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">{cat.label}</span>
            <FavoriteButton offerId={offer.id} className="absolute right-5 top-5" />
            <h1 className="absolute bottom-5 left-6 right-6 text-2xl font-bold text-white">{offer.title}</h1>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{offerBadge(offer, (v) => money.format(v, currency))}</span>
              {Number(offer.cashback_rate) > 0 && offer.discount_type !== "CASHBACK" && (
                <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700"><Wallet className="h-4 w-4" /> {offer.cashback_rate}% de cashback</span>
              )}
              {expired && <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">Expirée</span>}
              {offer.usage_limit && (
                <span className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${limitReached ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>
                  <Repeat className="h-4 w-4" />
                  {usage ? (limitReached ? `Déjà utilisée (${offer.usage_limit} ${PERIOD[offer.usage_period]})` : `Encore ${usage.remaining} utilisation${usage.remaining > 1 ? "s" : ""} ${PERIOD[offer.usage_period]}`) : `${offer.usage_limit} utilisation${offer.usage_limit > 1 ? "s" : ""} ${PERIOD[offer.usage_period]}`}
                </span>
              )}
            </div>

            {offer.discount_type === "PERK" && offer.perk_label && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
                <Gift className="h-6 w-6 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Privilège membre</p>
                  <p className="font-semibold text-slate-900">{offer.perk_label}</p>
                </div>
              </div>
            )}

            {offer.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{offer.description}</p>}

            <h2 className="mt-6 font-semibold text-slate-900">Conditions</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {offer.deal_terms && <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {offer.deal_terms}</li>}
              {merchant?.offer_terms && <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {merchant.offer_terms}</li>}
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Deux façons de valider : un code personnel à présenter en caisse (valable quelques minutes, usage unique), ou le PIN du partenaire saisi sur votre téléphone.</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> La remise est calculée sur le montant de l'addition saisi par le partenaire ; le cashback est crédité immédiatement sur votre wallet.</li>
              {offer.off_peak_hours && <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Créneaux : {offer.off_peak_hours}</li>}
            </ul>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {user ? (
                <>
                  <button onClick={() => setRedeem(true)} disabled={!canRedeem} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50">
                    <Tag className="h-4 w-4" /> {employeesOnly ? "Réservée aux salariés" : expired ? "Offre expirée" : limitReached ? "Limite atteinte" : "Afficher mon code"}
                  </button>
                  {canRedeem && (
                    <button onClick={() => setPinOpen(true)} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-5 py-3 font-medium text-emerald-700 hover:bg-emerald-50">
                      <KeyRound className="h-4 w-4" /> PIN du partenaire
                    </button>
                  )}
                </>
              ) : (
                <Link to="/register" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-medium text-white hover:bg-emerald-600">Créer un compte pour en profiter</Link>
              )}
              <ShareButton title={offer.title} path={offer.slug ? `/offre/${offer.slug}` : `/offer-details?id=${offer.id}`} />
              {offer.booking_required && merchant?.whatsapp && (
                <a
                  href={`https://wa.me/${String(merchant.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je suis membre Nelvin et je souhaite réserver pour l'offre « ${offer.title} ».`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-green-200 px-5 py-3 font-medium text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4" /> Réserver sur WhatsApp
                </a>
              )}
              {merchant?.lat != null && (
                <Link to={`/merchant-map?m=${merchant.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"><MapPin className="h-4 w-4" /> Carte</Link>
              )}
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          {merchant && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {merchant.logo_url && <img src={merchant.logo_url} alt="" className="h-12 w-12 rounded-xl border border-slate-100 object-contain p-1" />}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{merchant.name}</p>
                  <p className="flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Partenaire vérifié</p>
                  {merchant.reviews_count > 0 && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Stars value={Number(merchant.rating)} size="h-3 w-3" /> {Number(merchant.rating).toFixed(1)} ({merchant.reviews_count} avis)</p>}
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {[merchant.address, merchant.city, merchant.country].filter(Boolean).join(", ") || "—"}</div>
                {merchant.website && <a href={merchant.website.startsWith("http") ? merchant.website : `https://${merchant.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline"><Globe className="h-4 w-4" /> Site web</a>}
                {merchant.instagram && <p className="flex items-center gap-2 text-slate-600"><Instagram className="h-4 w-4 text-slate-400" /> {merchant.instagram}</p>}
                {merchant.contact_phone && <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {merchant.contact_phone}</p>}
              </dl>
              {merchant.description && <p className="mt-3 line-clamp-6 text-sm text-slate-500">{merchant.description}</p>}
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">En bref</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Pour</dt><dd className="font-medium text-slate-900">{AUDIENCE[offer.target_audience]}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Avantage</dt><dd className="font-medium text-emerald-600">{offerBadge(offer, (v) => money.format(v, currency))}</dd></div>
              {offer.usage_limit && <div className="flex justify-between"><dt className="text-slate-500">Utilisation</dt><dd className="font-medium text-slate-900">{offer.usage_limit}× {PERIOD[offer.usage_period]}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Valable jusqu'au</dt><dd className="font-medium text-slate-900">{offer.expires_at ? new Date(offer.expires_at).toLocaleDateString("fr-FR") : "Sans limite"}</dd></div>
            </dl>
          </div>
          <OfferReviews offerId={offer.id} canReview={!!user && usedOnce} />
        </div>
      </div>

      <AnimatePresence>
        {redeem && <QrRedemption offer={offer} onClose={() => { setRedeem(false); reload(); }} />}
        {pinOpen && <PinRedemption offer={offer} merchantName={merchant?.name} onClose={() => { setPinOpen(false); reload(); }} />}
      </AnimatePresence>
    </PortalLayout>
  );
}
