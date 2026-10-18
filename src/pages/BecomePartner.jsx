import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, ClipboardList, Loader2, MapPin, Star, Store, TrendingUp } from "lucide-react";
import { domainLogo } from "@/lib/logos";
import { useAuth } from "@/lib/AuthContext";
import { usePublicContent } from "@/hooks/usePublicContent";
import PartnerApplicationForm from "@/components/partner/PartnerApplicationForm";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const STEPS = [
  { icon: ClipboardList, title: "1. Candidature", text: "Créez votre compte marchand et présentez votre marque et votre première offre." },
  { icon: BadgeCheck, title: "2. Validation", text: "Notre équipe examine votre dossier sous 2 à 3 jours ouvrés. Vous pouvez déposer vos documents KYC en parallèle." },
  { icon: Store, title: "3. Activation", text: "Votre tableau de bord s'ouvre : validez les codes en caisse, suivez vos ventes et demandez vos paiements." },
];

const BENEFITS = [
  { icon: MapPin, title: "Visible sur la carte", text: "Les membres et les salariés des entreprises clientes vous trouvent près d'eux." },
  { icon: TrendingUp, title: "Des clients récurrents", text: "Chaque offre est utilisable plusieurs fois : vos membres reviennent." },
  { icon: Star, title: "Gratuit pour candidater", text: "Aucun frais d'inscription. Les formules marchand sont détaillées sur la page Tarifs." },
];

function TickerLogo({ logo_url, domain, name }) {
  const [src, setSrc] = useState(logo_url || domainLogo(domain));
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`Logo ${name}`}
      loading="lazy"
      className="h-10 w-10 rounded-lg bg-white object-contain p-1"
      onError={() => {
        if (logo_url && src === logo_url && domain) setSrc(domainLogo(domain));
        else setFailed(true);
      }}
    />
  );
}

// The application is tied to an account: it is what lets the partner follow the
// review, upload KYC documents and open the dashboard once validated.
function ApplicationSection() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const card = (title, text, actions) => (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>
    </div>
  );
  const primary = "inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700";
  const secondary = "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent("/merchant#apply");
    return card(
      "Créez votre compte marchand",
      "Votre candidature est liée à votre compte : vous suivez l'examen de votre dossier, déposez vos documents de vérification et accédez à votre tableau de bord dès la validation.",
      <>
        <Link to="/register?type=marchand" className={primary}>Créer un compte marchand <ArrowRight className="h-4 w-4" /></Link>
        <Link to={`/login?returnTo=${returnTo}`} className={secondary}>J'ai déjà un compte</Link>
      </>
    );
  }

  if (user?.merchant_id) {
    return card(
      "Votre candidature est déposée",
      "Suivez son examen, déposez vos documents de vérification (KYC) et retrouvez votre tableau de bord marchand.",
      <>
        <a href="/merchant-dashboard" className={primary}>Mon espace marchand <ArrowRight className="h-4 w-4" /></a>
        <a href="/kyc-verification" className={secondary}>Documents KYC</a>
      </>
    );
  }

  if (user?.role === "HR_ADMIN" || user?.role === "EMPLOYEE" || user?.company_id) {
    return card(
      "Ce compte est rattaché à une entreprise",
      "Un compte RH ou salarié ne peut pas devenir marchand sans perdre son accès à l'entreprise. Déconnectez-vous et créez un compte marchand distinct.",
      <Link to="/register?type=marchand" className={primary}>Créer un compte marchand</Link>
    );
  }

  return (
    <PartnerApplicationForm
      defaults={{ email: user?.email || "", contactName: user?.full_name || "", contactPhone: user?.phone || "" }}
    />
  );
}

export default function BecomePartner() {
  const content = usePublicContent();
  // Real partner logos only (CMS); the ticker is hidden until there are some.
  const ticker = (content?.logos || []).filter((l) => l.active !== false);
  const loop = [...ticker, ...ticker];

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 pb-16 pt-14 sm:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25">
            <Star className="h-4 w-4 text-amber-300" /> Candidature gratuite
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">Devenez partenaire Nelvin</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-50">
            Touchez les membres Nelvin et les salariés de nos entreprises clientes à travers l'Afrique. Candidater est gratuit, rapide et entièrement accompagné.
          </p>
          <a href="#apply" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50">
            Commencer ma candidature <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {ticker.length > 0 && (
          <div className="relative mt-12 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-blue-700 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-blue-700 to-transparent" />
            <div className="flex w-max items-center gap-8 px-6 animate-marquee">
              {loop.map((b, i) => (
                <div key={`${b.name}-${i}`} className="flex items-center gap-2.5">
                  <TickerLogo logo_url={b.logo_url} domain={b.domain} name={b.name} />
                  <span className="text-sm font-semibold text-white/90">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-center text-2xl font-bold text-slate-900">Comment ça marche</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <Icon className="h-6 w-6 text-blue-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <ApplicationSection />
      </section>

      <SiteFooter />
    </div>
  );
}
