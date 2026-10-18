import React from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, ShieldCheck, Tag } from "lucide-react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { offerBadge } from "@/hooks/useCatalog";
import { offerPath, useSeo } from "@/lib/seo";
import { Spinner } from "@/components/UiFeedback";
import ShareButton from "@/components/ShareButton";

/** Public, indexable page of a verified partner (/partenaire/:slug). */
export default function PartnerPage() {
  const { slug } = useParams();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const { data, loading } = useAsync(async () => {
    const [merchant] = await entities.Merchant.filter({ slug }, "-created_date", 1).catch(() => []);
    if (!merchant) return null;
    const offers = await entities.Offer.filter({ merchant_id: merchant.id }, "-created_date", 50).catch(() => []);
    return { merchant, offers: offers.filter((o) => !o.expires_at || new Date(o.expires_at) >= new Date()) };
  }, [slug]);

  const m = data?.merchant;
  const title = m ? (m.seo_title || `${m.name}${m.city ? ` à ${m.city}` : ""} — offres Nelvin`) : "";
  const description = m ? (m.seo_description || (m.description || m.offer_headline || "").slice(0, 200)) : "";
  useSeo({
    title,
    description,
    image: m?.cover_image_url || m?.logo_url || undefined,
    path: m ? `/partenaire/${m.slug}` : undefined,
    jsonLd: m && {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: m.name,
      description,
      image: m.cover_image_url || m.logo_url || undefined,
      url: m.website || undefined,
      telephone: m.contact_phone || undefined,
      address: { "@type": "PostalAddress", streetAddress: m.address || undefined, addressLocality: m.city || undefined, addressCountry: m.country || undefined },
      ...(m.lat != null ? { geo: { "@type": "GeoCoordinates", latitude: m.lat, longitude: m.lng } } : {}),
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {loading ? <Spinner /> : !m ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
            <p className="font-semibold">Partenaire introuvable</p>
            <Link to="/merchant-directory" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Voir tous les partenaires</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {m.logo_url && <img src={m.logo_url} alt={`Logo ${m.name}`} className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-contain p-1" />}
              <div>
                <h1 className="text-2xl font-bold">{m.name}</h1>
                <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {[m.city, m.country].filter(Boolean).join(", ")}</p>
                {m.verified_status === "VERIFIED" && <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Partenaire vérifié</p>}
              </div>
            </div>
            <div className="mt-4"><ShareButton title={m.name} path={`/partenaire/${m.slug}`} /></div>
            {m.offer_headline && <p className="mt-5 text-lg font-medium text-slate-800">{m.offer_headline}</p>}
            {m.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{m.description}</p>}
            <h2 className="mt-8 text-lg font-bold">Offres Nelvin</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {data.offers.map((o) => (
                <Link key={o.id} to={offerPath(o)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300">
                  <p className="flex items-center gap-1.5 font-semibold"><Tag className="h-4 w-4 text-emerald-600" /> {o.title}</p>
                  <p className="mt-1 text-sm font-bold text-emerald-600">{offerBadge(o, (v) => money.format(v, currency))}</p>
                </Link>
              ))}
              {data.offers.length === 0 && <p className="text-sm text-slate-500">Aucune offre active pour le moment.</p>}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
