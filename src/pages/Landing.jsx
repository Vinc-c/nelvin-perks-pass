import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Image } from "@/components/ui/image";
import { ArrowRight, Menu, X } from "lucide-react";
import MembershipCoverage from "@/components/landing/MembershipCoverage";
import PartnerLogos from "@/components/landing/PartnerLogos";
import Testimonials from "@/components/landing/Testimonials";
import FaqSection from "@/components/landing/FaqSection";
import AppDownloadCta from "@/components/landing/AppDownloadCta";
import HeroFallingCards from "@/components/landing/HeroFallingCards";
import HeroLifestyleStrip from "@/components/landing/HeroLifestyleStrip";
import SiteFooter from "@/components/landing/SiteFooter";
import PassShowcase from "@/components/landing/PassShowcase";
import AfricaPillars from "@/components/landing/AfricaPillars";
import HowItWorks from "@/components/landing/HowItWorks";
import NelvinLogo from "@/components/NelvinLogo";
import { useAuth } from "@/lib/AuthContext";
import { usePublicContent, imageByKey, copyByKey } from "@/hooks/usePublicContent";
import { useCatalog } from "@/hooks/useCatalog";
import { useAsync } from "@/hooks/useAsync";
import { entities } from "@/api/entities";
import KenteBand from "@/components/brand/KenteBand";

const SAVANNA = "/images/savanna.webp";

export default function Landing() {
  const { t } = useI18n();
  const ANNOUNCE = t("land.announce");
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const content = usePublicContent();
  const heroBg = imageByKey(content?.images, "hero_background", SAVANNA);
  const savannaBand = imageByKey(content?.images, "savanna_band", SAVANNA);
  const heroBadge = copyByKey(content?.copy, "hero.badge", t("land.hero.badge"));
  const heroTitle = copyByKey(content?.copy, "hero.title", t("land.hero.title"));
  const heroSubtitle = copyByKey(content?.copy, "hero.subtitle", t("land.hero.subtitle"));

  // Live figures from the catalogue (a CMS value, when set, takes precedence).
  const { merchants, offers } = useCatalog();
  const { data: rawReviews } = useAsync(() => entities.OfferReview.list("-created_date", 40).catch(() => []), [], { initial: [] });
  const cities = new Set(merchants.map((m) => (m.city || "").trim().toLowerCase()).filter(Boolean)).size;
  const counts = useMemo(() => offers.reduce((acc, o) => ({ ...acc, [o.category]: (acc[o.category] || 0) + 1 }), {}), [offers]);
  const merchantById = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);
  const reviews = rawReviews
    .filter((r) => !r.hidden && r.rating >= 4 && r.comment && merchantById.has(r.merchant_id))
    .slice(0, 15)
    .map((r) => {
      const m = merchantById.get(r.merchant_id);
      return { ...r, author: r.author_name || t("land.reviews.member"), where: [m.name, m.city].filter(Boolean).join(", ") };
    });
  const fmt = (n) => n.toLocaleString("en-US");
  const stats = [
    { value: copyByKey(content?.copy, "stats.brands", merchants.length ? fmt(merchants.length) : ""), label: t("land.stats.partners") },
    { value: copyByKey(content?.copy, "stats.offers", offers.length ? fmt(offers.length) : ""), label: t("land.stats.offers") },
    { value: copyByKey(content?.copy, "stats.cities", cities ? fmt(cities) : ""), label: t("land.stats.cities") },
    { value: copyByKey(content?.copy, "stats.collections", "15"), label: t("land.stats.categories") },
  ].filter((s) => s.value);
  const renderHeroTitle = () =>
    /\*[^*]+\*/.test(heroTitle)
      ? heroTitle.split(/\*([^*]+)\*/).map((part, i) => (i % 2 ? <span key={i} className="text-nv-bronze">{part}</span> : part))
      : heroTitle.split(/(across Africa|\d[\d,]*\+\s*brands)/i).map((part, i) =>
      /across Africa|\d[\d,]*\+\s*brands/i.test(part)
        ? <span key={i} className="text-nv-bronze">{part}</span>
        : part
    );

  return (
    <div className="min-h-screen overflow-x-clip bg-[radial-gradient(ellipse_at_top,_#F2EBDA_0%,_#FAF6EC_45%,_#ffffff_100%)] font-body text-nv-ink">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">{t("nav.skip")}</a>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-nv-line bg-white/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <NelvinLogo className="h-12" />
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-nv-muted lg:flex">
            <Link to="/merchant-directory" className="hover:text-brand">{t("nav.offers")}</Link>
            <Link to="/merchant-map" className="hover:text-brand">{t("nav.map")}</Link>
            <Link to="/pricing" className="hover:text-brand">{t("nav.pricing")}</Link>
            <Link to="/merchant" className="hover:text-brand">{t("nav.merchants")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden lg:block"><LanguageSwitcher compact variant="light" /></div>
            {isAuthenticated ? (
              <Link to="/app" className="hidden rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand/90 sm:inline-flex">
                {t("nav.mySpace")}
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-nv-ink transition hover:bg-nv-ivory-2 sm:inline-flex">
                  {t("cta.login")}
                </Link>
                <Link to="/register" className="hidden rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand/90 sm:inline-flex">
                  {t("cta.getStarted")}
                </Link>
              </>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={menuOpen} className="rounded-full p-2 text-nv-ink hover:bg-nv-ivory-2 lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-nv-line bg-white px-4 py-4 lg:hidden">
            <div className="mb-3 flex items-center justify-between rounded-full border border-nv-line px-3 py-1.5">
              <span className="text-xs font-medium text-nv-muted">{t("nav.language")}</span>
              <LanguageSwitcher variant="light" />
            </div>
            <nav className="flex flex-col gap-1 text-sm font-medium text-nv-ink">
              <Link to="/merchant-directory" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-nv-ivory-2">{t("nav.offers")}</Link>
              <Link to="/merchant-map" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-nv-ivory-2">{t("nav.map")}</Link>
              <Link to="/pricing" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-nv-ivory-2">{t("nav.pricing")}</Link>
              <Link to="/merchant" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-nv-ivory-2">{t("nav.merchants")}</Link>
              {isAuthenticated ? (
                <Link to="/app" onClick={() => setMenuOpen(false)} className="mt-2 rounded-full bg-brand px-4 py-2.5 text-center font-semibold text-white">{t("nav.mySpace")}</Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 rounded-full border border-nv-line px-4 py-2.5 text-center font-semibold text-nv-ink">{t("cta.login")}</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-full bg-brand px-4 py-2.5 text-center font-semibold text-white">{t("cta.getStarted")}</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
        {/* Slim black announcement band with gold scrolling text */}
        <div className="overflow-hidden bg-nv-deep">
          <div className="flex w-max animate-marquee whitespace-nowrap py-1 text-xs font-medium text-nv-gold-light">
            <span className="px-8">{ANNOUNCE}</span>
            <span className="px-8" aria-hidden="true">{ANNOUNCE}</span>
          </div>
        </div>
      </header>

      <main id="contenu">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* African landscape background */}
        <div className="absolute inset-0">
          <Image src={heroBg} fittingType="fill" className="h-full w-full animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/50 to-white/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#F2EBDA_0%,_transparent_70%)]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-brand">
              <span className="h-5 w-8 overflow-hidden rounded-full"><KenteBand height={20} /></span> {heroBadge}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-nv-ink sm:text-5xl lg:text-6xl">
              {renderHeroTitle()}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-nv-muted">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90">
                {t("land.hero.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#app-download" className="flex items-center justify-center gap-2 rounded-full border border-nv-line bg-white px-7 py-3.5 font-semibold text-nv-ink transition hover:bg-nv-ivory-2">
                {t("land.hero.app")}
              </a>
            </div>
          </motion.div>

          {/* Falling category cards (continuous top-to-bottom) */}
          <motion.div className="min-w-0" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <HeroFallingCards counts={counts} />
          </motion.div>
        </div>
      </section>

      {/* Lifestyle collections marquee — image-rich hero extension */}
      <section className="relative py-10">
        <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-brand">{t("land.lifestyle")}</p>
        </div>
        <HeroLifestyleStrip />
      </section>

      {/* Partner logos marquee — right below the hero */}
      <PartnerLogos merchants={merchants} />

      {/* Stats bar: live figures only */}
      {stats.length > 1 && (
        <section className="mx-auto -mt-2 max-w-5xl px-4 sm:px-6">
          <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-nv-ivory-2 shadow-xl shadow-slate-200/60 ring-1 ring-nv-line ${stats.length === 4 ? "sm:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : ""}`}>
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-5 py-6 text-center">
                <dd className="text-2xl font-extrabold text-nv-ink sm:text-3xl">{s.value}</dd>
                <dt className="mt-1 text-xs font-medium text-nv-muted sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}


      {/* The digital card and the three passes */}
      <PassShowcase />

      {/* Built for Africa */}
      <AfricaPillars />

      {/* How it works */}
      <HowItWorks />

      {/* African landscape band (ken-burns video feel) */}
      <section className="relative mt-20 h-64 overflow-hidden sm:h-80">
        <Image src={savannaBand} fittingType="fill" className="h-full w-full animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/55" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-semibold text-brand">{t("land.band.kicker")}</p>
              <h2 className="mt-2 max-w-xl text-3xl font-bold text-nv-ink sm:text-4xl">{t("land.band.title")}</h2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What your membership covers */}
      <MembershipCoverage />

      {/* Testimonials */}
      <Testimonials reviews={reviews} />

      {/* FAQ */}
      <FaqSection />

      {/* Start the good life now */}
      <div id="app-download">
        <AppDownloadCta />
      </div>

      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}