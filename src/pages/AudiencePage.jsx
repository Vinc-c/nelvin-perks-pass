import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, Check, User, Users } from "lucide-react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import KenteBand from "@/components/brand/KenteBand";
import { Stagger, StaggerItem, WordReveal, ScrambleText } from "@/components/landing/motion";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useI18n } from "@/i18n/I18nContext";

// One config per audience: where each button leads is decided here and nowhere else.
const AUDIENCES = {
  ind: { icon: User, cta1: "/register?type=particulier", cta2: "/pricing" },
  hr: { icon: Building2, cta1: "/register?type=entreprise", cta2: "/contact?type=company" },
  emp: { icon: Users, cta1: "/join", cta2: "/login" },
};
const OTHERS = [
  { id: "ind", to: "/for-individuals", name: "mm.ind.name" },
  { id: "hr", to: "/for-companies", name: "mm.hr.name" },
  { id: "emp", to: "/for-employees", name: "mm.emp.name" },
  { id: "mer", to: "/merchant", name: "mm.mer.name" },
];

/** Detailed page for one audience: read first, then create the account. */
export default function AudiencePage({ audience }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const a = AUDIENCES[audience];
  const k = (f) => t(`aud.${audience}.${f}`);
  useEffect(() => { document.title = `${k("h1")} | Nelvin Benefits`; window.scrollTo(0, 0); });

  const primary = "nv-focus group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-nv-emerald px-7 text-base font-medium text-white transition hover:bg-nv-deep";
  const ghost = "nv-focus inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-base font-medium text-white transition hover:bg-white/10";
  return (
    <div className="nv-body min-h-screen bg-white text-[#1A2060]">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[#1A2060] text-white">
          <motion.div aria-hidden initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 0.35, scale: 1 }} transition={{ duration: 1.2 }} className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-nv-emerald blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20"><a.icon className="h-4 w-4" /> <ScrambleText text={k("badge")} /></span>
            <WordReveal as="h1" text={k("h1")} className="nv-display mt-5 max-w-[20ch] text-4xl font-semibold leading-tight sm:text-6xl" />
            <p className="mt-5 max-w-2xl text-lg text-white/80">{k("lead")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={a.cta1} className={primary}>{k("cta1")} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" /></Link>
              <Link to={a.cta2} className={ghost}>{k("cta2")}</Link>
            </div>
          </div>
          <KenteBand height={14} />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("aud.benefits")}</h2>
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <StaggerItem key={n}>
                <div className="h-full rounded-3xl border border-slate-200 bg-slate-50/60 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nv-emerald text-white"><Check className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-bold">{k(`b${n}.t`)}</h3>
                  <p className="mt-1.5 text-slate-600">{k(`b${n}.d`)}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("aud.steps")}</h2>
            <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <StaggerItem key={n}>
                  <div className="h-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A2060] text-lg font-bold text-white">{n}</span>
                    <h3 className="mt-4 text-lg font-bold">{k(`s${n}.t`)}</h3>
                    <p className="mt-1.5 text-slate-600">{k(`s${n}.d`)}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">{t("aud.faq")}</h2>
          <Accordion type="single" collapsible className="mt-8">
            {[1, 2, 3].map((n) => (
              <AccordionItem key={n} value={`q${n}`}>
                <AccordionTrigger className="text-left text-base font-semibold">{k(`q${n}`)}</AccordionTrigger>
                <AccordionContent className="text-slate-600">{k(`a${n}`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="bg-[#1A2060] text-white">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="nv-display text-3xl font-semibold sm:text-4xl">{t("aud.ready")}</h2>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={a.cta1} className={primary}>{k("cta1")} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" /></Link>
              <Link to={a.cta2} className={ghost}>{k("cta2")}</Link>
            </div>
            <p className="mt-10 text-sm text-white/60">{t("aud.other")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {OTHERS.filter((o) => o.id !== audience).map((o) => (
                <Link key={o.id} to={o.to} className="nv-focus rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10">{t(o.name)}</Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
