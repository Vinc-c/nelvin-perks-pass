import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import KenteBand from "@/components/brand/KenteBand";
import Motif from "@/components/brand/Motif";
import PassCard from "@/components/landing/PassCard";
import SiteFooter from "@/components/landing/SiteFooter";
import SiteHeader from "@/components/landing/SiteHeader";
import InstallAppButton from "@/components/InstallAppButton";
import PartnerMap from "@/components/map/PartnerMap";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAuth } from "@/lib/AuthContext";
import { useCatalog, offerBadge } from "@/hooks/useCatalog";
import { useCurrencies } from "@/hooks/useCurrencies";
import { usePlans } from "@/hooks/usePlans";
import { useAsync } from "@/hooks/useAsync";
import { entities } from "@/api/entities";
import { OFFER_CATEGORIES } from "@/data/offerCategories";

const minPrice = (plans) => {
  const prices = plans.map((p) => Number(p.price_monthly)).filter((v) => v > 0);
  return prices.length ? Math.min(...prices) : null;
};

const FAQ = [
  { q: "Comment fonctionne le Pass Nelvin ?", a: "Choisissez une offre dans l'application, puis validez-la en caisse : soit le partenaire scanne votre code personnel, soit il tape son code PIN sur votre téléphone. La remise est calculée sur le montant réel de l'addition, et le cashback arrive aussitôt dans votre wallet." },
  { q: "Faut-il télécharger une application ?", a: "Non. Nelvin s'ouvre dans le navigateur de votre téléphone et peut s'installer sur l'écran d'accueil en un geste, comme une application." },
  { q: "Comment payer mon Pass ?", a: "En Mobile Money, par carte bancaire, par virement ou avec le solde de votre wallet Nelvin. Les montants s'affichent dans votre devise." },
  { q: "Mon entreprise peut-elle m'offrir le Pass ?", a: "Oui. Les entreprises abonnent leurs salariés, distribuent des allocations mensuelles et suivent l'utilisation depuis leur espace RH." },
  { q: "Je suis commerçant, comment rejoindre le réseau ?", a: "Remplissez la candidature partenaire. L'équipe Nelvin vérifie votre commerce, puis vos offres sont visibles par tous les membres et sur la carte." },
];

const STEPS = [
  { title: "Choisissez une offre", text: "Restaurants, salons, salles de sport, hôtels : filtrez par ville, catégorie ou distance." },
  { title: "Validez en caisse", text: "Montrez votre code personnel, ou laissez le caissier taper son code PIN sur votre téléphone." },
  { title: "Payez moins, gagnez du cashback", text: "La remise est appliquée à l'addition et le cashback est crédité tout de suite sur votre wallet." },
];

export default function Landing() {
  const { user } = useAuth();
  const { merchants, offers, loading } = useCatalog();
  const money = useCurrencies();
  const { plans } = usePlans();
  const { data: reviews } = useAsync(() => entities.OfferReview.list("-created_date", 60).catch(() => []), [], { initial: [] });

  useEffect(() => { document.title = "Nelvin — le pass des bons plans en Afrique"; }, []);

  const located = merchants.filter((m) => m.lat != null && m.lng != null);
  const cities = new Set(merchants.map((m) => (m.city || "").trim().toLowerCase()).filter(Boolean));
  const countries = new Set(merchants.map((m) => (m.country || "").trim()).filter(Boolean));
  const perCategory = useMemo(() => merchants.reduce((acc, m) => ({ ...acc, [m.category]: (acc[m.category] || 0) + 1 }), {}), [merchants]);
  const offerById = useMemo(() => new Map(offers.map((o) => [o.id, o])), [offers]);
  const goodReviews = reviews.filter((r) => r.rating >= 4 && r.comment && offerById.has(r.offer_id)).slice(0, 6);
  const featured = offers.filter((o) => o.is_featured).concat(offers.filter((o) => !o.is_featured)).slice(0, 6);

  const passFrom = minPrice(plans.filter((p) => p.audience === "B2C"));
  const b2bFrom = minPrice(plans.filter((p) => p.audience === "B2B"));
  const merchantFrom = minPrice(plans.filter((p) => p.audience === "MERCHANT"));
  const usd = (v) => money.format(v, "USD");
  const africanCurrencies = money.currencies.filter((c) => !["USD", "EUR", "GBP", "AED"].includes(c.code) && c.active !== false);


  return (
    <div className="nv-body min-h-screen bg-white text-[#0E1A3B]">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2">Aller au contenu</a>

      <SiteHeader />

      <main id="contenu">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0E1A3B] text-white">
          <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#27306E] opacity-60 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-24 lg:pt-20">
            <div>
              <h1 className="nv-display max-w-[14ch] text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
                Le pass des bons plans, de Dakar à Nairobi.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Restaurants, salons, salles de sport et hôtels près de chez vous : présentez Nelvin en caisse, payez moins et recevez du cashback dans votre monnaie.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/merchant-directory" className="nv-focus rounded-full bg-[#D4A13A] px-7 py-3.5 text-center font-semibold text-[#0E1A3B] hover:bg-[#e0b350]">Voir les offres</Link>
                <Link to="/merchant" className="nv-focus rounded-full border border-white/30 px-7 py-3.5 text-center font-semibold hover:bg-white/10">Inscrire mon commerce</Link>
              </div>
              <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                <div className="border-l-2 border-[#D4A13A] pl-3"><dt className="text-white/60">Paiement</dt><dd className="font-semibold">Mobile Money, carte ou wallet</dd></div>
                <div className="border-l-2 border-[#D4A13A] pl-3"><dt className="text-white/60">En caisse</dt><dd className="font-semibold">Code personnel ou PIN partenaire</dd></div>
                {passFrom && <div className="border-l-2 border-[#D4A13A] pl-3"><dt className="text-white/60">Le Pass</dt><dd className="font-semibold">Dès {usd(passFrom)} par mois</dd></div>}
              </dl>
            </div>
            <PassCard holder={user?.full_name} />
          </div>
          <KenteBand height={22} />
        </section>

        {/* Live network */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="reseau">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h2 id="reseau" className="nv-display text-3xl font-semibold leading-tight sm:text-4xl">Le réseau, en direct</h2>
              {loading ? (
                <p className="mt-4 h-16 animate-pulse rounded bg-[#EEF1F7]" aria-busy="true" />
              ) : merchants.length > 0 ? (
                <p className="mt-4 text-lg leading-relaxed text-slate-700">
                  <strong className="text-[#0E1A3B]">{merchants.length} partenaire{merchants.length > 1 ? "s" : ""} vérifié{merchants.length > 1 ? "s" : ""}</strong>
                  {cities.size > 0 && <> dans {cities.size} ville{cities.size > 1 ? "s" : ""}</>}
                  {countries.size > 1 && <> et {countries.size} pays</>}, avec <strong className="text-[#0E1A3B]">{offers.length} offre{offers.length > 1 ? "s" : ""} active{offers.length > 1 ? "s" : ""}</strong>. Chaque repère est un commerce contrôlé par notre équipe.
                </p>
              ) : (
                <p className="mt-4 text-lg leading-relaxed text-slate-700">
                  Le réseau ouvre ses portes. Chaque commerce est vérifié avant d'apparaître sur la carte : les premiers partenaires référencés seront les plus visibles auprès des membres.
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/merchant-map" className="nv-focus rounded-full bg-[#0E1A3B] px-6 py-3 font-semibold text-white hover:bg-[#27306E]">Ouvrir la carte</Link>
                {merchants.length === 0 && <Link to="/merchant" className="nv-focus rounded-full border border-[#0E1A3B]/20 px-6 py-3 font-semibold hover:bg-[#EEF1F7]">Devenir partenaire</Link>}
              </div>
            </div>
            <div className="relative h-[380px] overflow-hidden rounded-[28px] ring-1 ring-slate-200 sm:h-[440px]">
              <PartnerMap merchants={located} interactive={false} onSelect={(m) => { window.location.href = `/merchant-map?m=${m.id}`; }} />
            </div>
          </div>
        </section>

        {/* Featured offers (real) */}
        {featured.length > 0 && (
          <section className="bg-[#EEF1F7] py-20" aria-labelledby="offres">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="offres" className="nv-display text-3xl font-semibold sm:text-4xl">À saisir en ce moment</h2>
                <Link to="/merchant-directory" className="nv-focus rounded font-semibold text-[#27306E] underline decoration-[#D4A13A] decoration-2 underline-offset-4">Toutes les offres</Link>
              </div>
              <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((o) => (
                  <li key={o.id}>
                    <Link to={`/offer-details?id=${o.id}`} className="nv-focus group flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-[#D4A13A]">
                      {o.image_url || o.merchant?.cover_image_url ? (
                        <img src={o.image_url || o.merchant.cover_image_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                      ) : <Motif category={o.category} className="h-20 w-20 shrink-0" rounded="rounded-xl" />}
                      <span className="min-w-0">
                        <span className="block text-lg font-bold text-[#0E7C66]">{offerBadge(o, usd)}</span>
                        <span className="block truncate font-semibold">{o.title}</span>
                        <span className="block truncate text-sm text-slate-500">{o.merchant_name}{o.city ? `, ${o.city}` : ""}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* How it works — a real sequence */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="comment">
          <h2 id="comment" className="nv-display max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Trois gestes en caisse</h2>
          <ol className="mt-12 grid gap-10 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="nv-display block text-5xl font-semibold leading-none text-[#D4A13A]" aria-hidden="true">{i + 1}</span>
                <h3 className="mt-4 border-t-4 border-[#0E1A3B] pt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <figure className="mt-12 max-w-xl rounded-2xl bg-[#0E1A3B] p-6 text-white">
            <figcaption className="text-sm text-white/60">Exemple de calcul pour une offre à −50 % avec 5 % de cashback</figcaption>
            <dl className="mt-4 space-y-2 tabular-nums">
              <div className="flex justify-between"><dt>Addition</dt><dd>20 000 FCFA</dd></div>
              <div className="flex justify-between text-[#7fd6bd]"><dt>Remise Nelvin</dt><dd>− 10 000 FCFA</dd></div>
              <div className="flex justify-between border-t border-white/15 pt-2 text-lg font-bold"><dt>Vous payez</dt><dd>10 000 FCFA</dd></div>
              <div className="flex justify-between text-[#D4A13A]"><dt>Cashback sur votre wallet</dt><dd>+ 500 FCFA</dd></div>
            </dl>
          </figure>
        </section>

        {/* Categories */}
        <section className="border-y border-slate-200 bg-white py-20" aria-labelledby="categories">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 id="categories" className="nv-display text-3xl font-semibold sm:text-4xl">Tout ce qui fait la ville</h2>
            <ul className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {OFFER_CATEGORIES.map((c) => (
                <li key={c.value} className="border-b border-slate-200">
                  <Link to={`/merchant-directory?category=${c.value}`} className="nv-focus flex items-center gap-4 rounded py-4 hover:text-[#27306E]">
                    <Motif category={c.value} className="h-11 w-11 shrink-0" />
                    <span className="flex-1 font-semibold">{c.label}</span>
                    {perCategory[c.value] > 0 && <span className="text-sm tabular-nums text-slate-500">{perCategory[c.value]} partenaire{perCategory[c.value] > 1 ? "s" : ""}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Money made for Africa */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2" aria-labelledby="paiement">
          <div>
            <h2 id="paiement" className="nv-display text-3xl font-semibold leading-tight sm:text-4xl">Votre monnaie, vos moyens de paiement</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">Payez votre Pass en Mobile Money, par carte, par virement ou avec votre wallet. Les prix, les économies et le cashback s'affichent dans la devise que vous choisissez, et vos gains se retirent vers Mobile Money ou un compte bancaire.</p>
          </div>
          {africanCurrencies.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 self-center sm:grid-cols-3" aria-label="Devises disponibles">
              {africanCurrencies.map((c) => (
                <li key={c.code} className="rounded-2xl bg-[#EEF1F7] p-4">
                  <p className="nv-display text-2xl font-semibold">{c.code}</p>
                  <p className="text-sm text-slate-600">{c.name}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Companies & merchants */}
        <section className="grid lg:grid-cols-2" aria-label="Entreprises et commerçants">
          <div className="bg-[#27306E] px-6 py-16 text-white sm:px-12 lg:py-20">
            <h2 className="nv-display text-3xl font-semibold">Pour les entreprises</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/80">Offrez le Pass à vos équipes, distribuez des allocations mensuelles en un clic et suivez l'adoption depuis votre espace RH.</p>
            <ul className="mt-6 space-y-2 text-white/90">
              <li>Invitations par code et gestion des sièges</li>
              <li>Budget avantages et allocations par salarié</li>
              <li>Mur de reconnaissance et rapports d'économies</li>
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="nv-focus rounded-full bg-[#D4A13A] px-6 py-3 font-semibold text-[#0E1A3B] hover:bg-[#e0b350]">Équiper mon entreprise</Link>
              {b2bFrom && <span className="text-sm text-white/70">Dès {usd(b2bFrom)} par mois, 30 jours d'essai</span>}
            </div>
          </div>
          <div className="bg-[#D4A13A] px-6 py-16 text-[#0E1A3B] sm:px-12 lg:py-20">
            <h2 className="nv-display text-3xl font-semibold">Pour les commerçants</h2>
            <p className="mt-4 max-w-md leading-relaxed">Faites venir de nouveaux clients aux heures creuses. Vous fixez vos offres, Nelvin vous apporte des membres qui paient.</p>
            <ul className="mt-6 space-y-2">
              <li>Validation en caisse par code ou par PIN, sans matériel</li>
              <li>Paiements par wallet reversés sur votre solde</li>
              <li>Fiche sur la carte, avis vérifiés et statistiques</li>
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/merchant" className="nv-focus rounded-full bg-[#0E1A3B] px-6 py-3 font-semibold text-white hover:bg-[#27306E]">Inscrire mon commerce</Link>
              {merchantFrom && <span className="text-sm">Offres dès {usd(merchantFrom)} par mois</span>}
            </div>
          </div>
        </section>

        {/* Verified reviews (real only) */}
        {goodReviews.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6" aria-labelledby="avis">
            <h2 id="avis" className="nv-display text-3xl font-semibold sm:text-4xl">Ce qu'en disent les membres</h2>
            <p className="mt-2 text-slate-600">Avis laissés après une offre réellement utilisée.</p>
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goodReviews.map((r) => {
                const o = offerById.get(r.offer_id);
                return (
                  <li key={r.id} className="rounded-2xl border border-slate-200 p-6">
                    <p className="text-[#D4A13A]" aria-label={`${r.rating} sur 5`}>{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
                    <blockquote className="mt-3 leading-relaxed text-slate-700">« {r.comment} »</blockquote>
                    <p className="mt-4 text-sm font-semibold">{r.author_name}</p>
                    <p className="text-sm text-slate-500">{o.title} chez {o.merchant_name}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-[#EEF1F7] py-20" aria-labelledby="faq">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <h2 id="faq" className="nv-display text-3xl font-semibold sm:text-4xl">Vos questions</h2>
              <Link to="/help-center" className="nv-focus mt-6 inline-flex rounded-full border border-[#0E1A3B]/20 bg-white px-6 py-3 font-semibold hover:bg-white/70">Centre d'aide</Link>
            </div>
            <Accordion type="single" collapsible defaultValue="q0" className="rounded-2xl bg-white px-2 ring-1 ring-slate-200">
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`q${i}`} className="px-4">
                  <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-slate-600">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Open on phone */}
        <section className="relative overflow-hidden bg-[#0E1A3B] text-white" aria-labelledby="telephone">
          <img src="/images/savanna.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 id="telephone" className="nv-display text-3xl font-semibold leading-tight sm:text-4xl">Nelvin dans votre poche</h2>
              <p className="mt-4 text-lg text-white/80">Aucune application à télécharger depuis un store : scannez le code, puis ajoutez Nelvin à l'écran d'accueil de votre téléphone.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/register" className="nv-focus rounded-full bg-[#D4A13A] px-7 py-3.5 font-semibold text-[#0E1A3B] hover:bg-[#e0b350]">Créer mon compte</Link>
                <InstallAppButton />
              </div>
            </div>
            <div className="flex items-center gap-4 self-start rounded-2xl bg-white p-4 text-[#0E1A3B] md:self-auto">
              <QRCodeSVG value={`${window.location.origin}/app`} size={132} level="M" fgColor="#0E1A3B" aria-label="QR code : ouvrir Nelvin sur votre téléphone" />
              <p className="max-w-[10rem] text-sm font-semibold">Visez ce code avec l'appareil photo de votre téléphone</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
