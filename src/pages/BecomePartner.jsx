import React, { useEffect } from "react";
import PartnerApplicationForm from "@/components/partner/PartnerApplicationForm";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import KenteBand from "@/components/brand/KenteBand";
import { usePublicContent } from "@/hooks/usePublicContent";
import { usePlans } from "@/hooks/usePlans";
import { useCurrencies } from "@/hooks/useCurrencies";

const STEPS = [
  { title: "Vous candidatez", text: "Présentez votre commerce, votre offre membre et placez votre adresse sur la carte. Comptez dix minutes." },
  { title: "Nous vérifions", text: "L'équipe partenaires contrôle votre commerce et vous répond par e-mail sous 2 à 3 jours ouvrés." },
  { title: "Vous êtes visible", text: "Votre offre apparaît dans l'application et votre commerce sur la carte, auprès des membres et des salariés des entreprises clientes." },
  { title: "Vous encaissez", text: "En caisse, scannez le code du membre ou tapez votre PIN sur son téléphone. Ventes et reversements se suivent dans votre espace." },
];

export default function BecomePartner() {
  const content = usePublicContent();
  const logos = (content?.logos || []).filter((l) => l.active !== false && /^https:\/\//.test(l.logo_url || ""));
  const { plans } = usePlans();
  const money = useCurrencies();
  const prices = plans.filter((p) => p.audience === "MERCHANT").map((p) => Number(p.price_monthly)).filter((v) => v > 0);
  const from = prices.length ? Math.min(...prices) : null;

  useEffect(() => { document.title = "Devenir partenaire Nelvin"; }, []);

  return (
    <div className="nv-body min-h-screen bg-[#EEF1F7] text-[#0E1A3B]">
      <SiteHeader />
      <main>
        <section className="bg-[#0E1A3B] text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:pb-20 lg:pt-20">
            <div>
              <h1 className="nv-display max-w-[16ch] text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                De nouveaux clients, sans payer de publicité.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Les membres Nelvin et les salariés des entreprises clientes cherchent où dépenser près de chez eux. Proposez-leur une offre, ils viennent chez vous.
              </p>
              <a href="#candidature" className="nv-focus mt-8 inline-flex rounded-full bg-[#D4A13A] px-7 py-3.5 font-semibold text-[#0E1A3B] hover:bg-[#e0b350]">
                Commencer ma candidature
              </a>
            </div>
            <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <div className="border-l-2 border-[#D4A13A] pl-4"><dt className="text-white/60">Vous fixez l'offre</dt><dd className="mt-0.5 text-base font-semibold">Remise, 2-pour-1 ou cadeau, jours et plafonds compris</dd></div>
              <div className="border-l-2 border-[#D4A13A] pl-4"><dt className="text-white/60">Paiement</dt><dd className="mt-0.5 text-base font-semibold">Ventes wallet reversées en Mobile Money ou virement</dd></div>
              {from && <div className="border-l-2 border-[#D4A13A] pl-4"><dt className="text-white/60">Abonnement partenaire</dt><dd className="mt-0.5 text-base font-semibold">Dès {money.format(from, "USD")} par mois</dd></div>}
            </dl>
          </div>
          <KenteBand height={18} />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="etapes">
          <h2 id="etapes" className="nv-display text-2xl font-semibold sm:text-3xl">Comment ça se passe</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t-2 border-[#0E1A3B] pt-4">
                <p className="nv-display text-sm font-semibold text-[#9C4A2F]">Étape {i + 1}</p>
                <h3 className="nv-display mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          {logos.length > 0 && (
            <div className="mt-14">
              <h2 className="text-sm font-semibold text-slate-600">Ils sont déjà partenaires</h2>
              <ul className="mt-4 flex flex-wrap items-center gap-3">
                {logos.slice(0, 16).map((l) => (
                  <li key={l.id || l.name} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 ring-1 ring-slate-200">
                    <img src={l.logo_url} alt="" className="h-8 w-8 rounded-full object-contain" loading="lazy" />
                    <span className="text-sm font-medium">{l.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section id="candidature" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6" aria-label="Candidature partenaire">
          <PartnerApplicationForm />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
