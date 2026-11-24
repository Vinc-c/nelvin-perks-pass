import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";
import { Image } from "@/components/ui/image";
import { ArrowRight } from "lucide-react";
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
import { HeroHeadline, HeroOrbs, Magnetic, Tilt, ScrollCue } from "@/components/landing/HeroMotion";
import { Counter } from "@/components/landing/motion";
import IndustriesGrid from "@/components/landing/IndustriesGrid";
import { ScrollProgress, WordReveal } from "@/components/landing/motion";
import SiteHeader from "@/components/landing/SiteHeader";
import { usePublicContent, imageByKey, heroMedia, copyByKey } from "@/hooks/usePublicContent";
import SiteBanner from "@/components/marketing/SiteBanner";
import Reveal from "@/components/landing/Reveal";
import HeroSlides from "@/components/landing/HeroSlides";
import { useCatalog } from "@/hooks/useCatalog";
import { useAsync } from "@/hooks/useAsync";
import { entities } from "@/api/entities";
import KenteBand from "@/components/brand/KenteBand";

const SAVANNA = "/images/savanna.webp";

export default function Landing() {
  const { t, lang } = useI18n();
  const heroRef = React.useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(heroProgress, [0, 1], ["0%", "18%"]);
  const heroBgScale = useTransform(heroProgress, [0, 1], [1, 1.18]);
  const heroTextY = useTransform(heroProgress, [0, 1], ["0%", "-12%"]);
  const heroTextOpacity = useTransform(heroProgress, [0, 0.9], [1, 0.6]);
  const heroCardsY = useTransform(heroProgress, [0, 1], ["0%", "-22%"]);
  const ANNOUNCE = t("land.announce");
  const content = usePublicContent();
  const heroSlides = useMemo(() => { const l = heroMedia(content?.images); return l.length ? l : [{ type: "image", url: SAVANNA }]; }, [content?.images]);
  const savannaBand = imageByKey(content?.images, "savanna_band", SAVANNA);
  const heroBadge = copyByKey(content?.copy, "hero.badge", t("land.hero.badge"));
  const heroTitle = copyByKey(content?.copy, "hero.title", t("land.hero.title"));
  const heroSubtitle = copyByKey(content?.copy, "hero.subtitle", t("land.hero.subtitle"));

  // Live figures from the catalogue (a CMS value, when set, takes precedence).
  const { merchants, offers } = useCatalog();
  const { data: rawReviews } = useAsync(() => entities.OfferReview.list("-created_date", 40).catch(() => []), [], { initial: [] });
  const counts = useMemo(() => offers.reduce((acc, o) => ({ ...acc, [o.category]: (acc[o.category] || 0) + 1 }), {}), [offers]);
  const merchantById = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);
  const reviews = rawReviews
    .filter((r) => !r.hidden && r.rating >= 4 && r.comment && merchantById.has(r.merchant_id))
    .slice(0, 15)
    .map((r) => {
      const m = merchantById.get(r.merchant_id);
      return { ...r, author: r.author_name || t("land.reviews.member"), where: [m.name, m.city].filter(Boolean).join(", ") };
    });
  const rotateExtra = useMemo(() => (["en", "fr"].includes(lang) ? t("land.hero.rotate").split("|").map((x) => x.trim()).filter(Boolean) : []), [t, lang]);
  const heroSegments = (/\*[^*]+\*/.test(heroTitle)
    ? heroTitle.split(/\*([^*]+)\*/).map((text, i) => ({ text, accent: i % 2 === 1 }))
    : heroTitle.split(/(across Africa|\d[\d,]*\+\s*brands)/i).map((text) => ({ text, accent: /across Africa|\d[\d,]*\+\s*brands/i.test(text) }))
  ).map((seg, i, all) => (seg.accent && all.findIndex((x) => x.accent) === i ? { ...seg, rotate: [seg.text, ...rotateExtra] } : seg));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#F1F2FA_0%,_#FBFBFE_45%,_#ffffff_100%)] font-body text-nv-ink">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">{t("nav.skip")}</a>
      {/* Nav */}
      <ScrollProgress />
      <SiteHeader />
      {/* Slim announcement band with gold scrolling text */}
        <div className="overflow-hidden bg-nv-deep">
          <div className="flex w-max animate-marquee whitespace-nowrap py-1 text-xs font-medium text-nv-gold-light">
            <span className="px-8">{ANNOUNCE}</span>
            <span className="px-8" aria-hidden="true">{ANNOUNCE}</span>
          </div>
        </div>


      <main id="contenu">
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 empty:hidden"><SiteBanner placement="HOME_TOP" /></div>
      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* African landscape background: parallax + slow zoom while scrolling */}
        <motion.div className="absolute inset-0 will-change-transform" style={reduceMotion ? undefined : { y: heroBgY, scale: heroBgScale }}>
          <HeroSlides images={heroSlides} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#F1F2FA_0%,_transparent_70%)]" />
        </motion.div>
        <HeroOrbs />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
          <motion.div className="min-w-0 rounded-[32px] bg-white/60 p-5 shadow-[0_8px_40px_-12px_rgba(26,32,96,0.18)] ring-1 ring-white/70 backdrop-blur-md sm:p-8 lg:-ms-8" style={reduceMotion ? undefined : { y: heroTextY, opacity: heroTextOpacity }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 py-1.5 pl-1.5 pr-4 text-sm font-medium text-brand">
              <span className="h-5 w-8 overflow-hidden rounded-full"><KenteBand height={20} /></span> {heroBadge}
            </span>
            <HeroHeadline segments={heroSegments} className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-nv-ink sm:text-5xl lg:text-6xl" />
            <motion.p className="mt-5 max-w-xl text-lg text-nv-muted" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}>
              {heroSubtitle}
            </motion.p>
            <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.6 }}>
              <Magnetic>
              <Link to="/pricing" className="group flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90">
                {t("land.hero.cta")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              </Magnetic>
              <a href="#app-download" className="flex items-center justify-center gap-2 rounded-full border border-nv-line bg-white px-7 py-3.5 font-semibold text-nv-ink transition hover:bg-nv-ivory-2">
                {t("land.hero.app")}
              </a>
            </motion.div>
            {merchants.length > 0 && (
              <motion.p className="mt-6 flex items-center gap-2 text-sm text-nv-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.6 }}>
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nv-emerald/60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-nv-emerald" /></span>
                <span><Counter value={merchants.length} className="font-semibold text-nv-ink" /> {t("land.hero.live")}</span>
              </motion.p>
            )}
          </motion.div>

          {/* Falling category cards (continuous top-to-bottom) */}
          <motion.div className="min-w-0" style={reduceMotion ? undefined : { y: heroCardsY }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <Tilt><HeroFallingCards counts={counts} /></Tilt>
          </motion.div>
        </div>
        <div className="relative pb-4"><ScrollCue label={t("land.hero.scroll")} /></div>
      </section>
      <span id="contenu-suite" />

      {/* Lifestyle collections marquee — image-rich hero extension */}
      <section className="relative py-10">
        <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold text-brand">{t("land.lifestyle")}</p>
        </div>
        <HeroLifestyleStrip />
      </section>

      {/* Partner logos marquee — right below the hero */}
      <PartnerLogos merchants={merchants} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6"><SiteBanner placement="HOME_MID" /></div>

      {/* The digital card and the three passes */}
      <Reveal><PassShowcase /></Reveal>

      {/* Built for Africa */}
      <Reveal><AfricaPillars /></Reveal>

      {/* Categories */}
      <IndustriesGrid counts={counts} />

      {/* How it works */}
      <Reveal><HowItWorks /></Reveal>

      {/* African landscape band (ken-burns video feel) */}
      <section className="relative mt-20 h-64 overflow-hidden sm:h-80">
        <Image src={savannaBand} fittingType="fill" className="h-full w-full animate-kenburns" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/75 to-white/55" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-sm font-semibold text-brand">{t("land.band.kicker")}</p>
              <WordReveal text={t("land.band.title")} className="mt-2 max-w-xl text-3xl font-bold text-nv-ink sm:text-4xl" />
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