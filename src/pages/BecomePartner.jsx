import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, ClipboardList, Loader2, MapPin, MessageCircle, Star, Store, TrendingUp, Wallet } from "lucide-react";
import { Stagger, StaggerItem, WordReveal } from "@/components/landing/motion";
import { domainLogo } from "@/lib/logos";
import { useAuth } from "@/lib/AuthContext";
import { usePublicContent } from "@/hooks/usePublicContent";
import PartnerApplicationForm from "@/components/partner/PartnerApplicationForm";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { useI18n } from "@/i18n/I18nContext";

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const STEPS = [
  { icon: ClipboardList, k: "s1" },
  { icon: BadgeCheck, k: "s2" },
  { icon: Store, k: "s3" },
];

const BENEFITS = [
  { icon: MapPin, k: "b1" },
  { icon: TrendingUp, k: "b2" },
  { icon: Wallet, k: "b4" },
  { icon: Star, k: "b3" },
];
const EASE = [0.16, 1, 0.3, 1];

function TickerLogo({ logo_url, domain, name }) {
  const { t } = useI18n();
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
      alt={t("mc.bp.logoAlt", { name })}
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
  const { t } = useI18n();

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
  const primary = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90";
  const secondary = "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent("/merchant#apply");
    return card(
      t("mc.bp.c1.t"),
      t("mc.bp.c1.d"),
      <>
        <Link to="/register?type=marchand" className={primary}>{t("mc.bp.c1.a")} <ArrowRight className="h-4 w-4" /></Link>
        <Link to={`/login?returnTo=${returnTo}`} className={secondary}>{t("mc.bp.c1.b")}</Link>
      </>
    );
  }

  if (user?.merchant_id) {
    return card(
      t("mc.bp.c2.t"),
      t("mc.bp.c2.d"),
      <>
        <a href="/merchant-dashboard" className={primary}>{t("mc.bp.c2.a")} <ArrowRight className="h-4 w-4" /></a>
        <a href="/kyc-verification" className={secondary}>{t("mc.bp.c2.b")}</a>
      </>
    );
  }

  if (user?.role === "HR_ADMIN" || user?.role === "EMPLOYEE" || user?.company_id) {
    return card(
      t("mc.bp.c3.t"),
      t("mc.bp.c3.d"),
      <Link to="/register?type=marchand" className={primary}>{t("mc.bp.c1.a")}</Link>
    );
  }

  return (
    <PartnerApplicationForm
      defaults={{ email: user?.email || "", contactName: user?.full_name || "", contactPhone: user?.phone || "" }}
    />
  );
}

export default function BecomePartner() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const content = usePublicContent();
  // Real partner logos only (CMS); the ticker is hidden until there are some.
  const ticker = (content?.logos || []).filter((l) => l.active !== false);
  const loop = [...ticker, ...ticker];
  const rise = (d = 0) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: EASE, delay: d } });

  return (
    <div className="nv-body min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />

      <section className="relative overflow-hidden bg-[#1A2060] pb-16 pt-14 text-white sm:pt-24">
        {/* Slow drifting light, purely decorative. */}
        <motion.div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#E82B2C]/25 blur-3xl" animate={reduced ? undefined : { x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-[#FF5A5C]/15 blur-3xl" animate={reduced ? undefined : { x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.span {...rise(0)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/20">
            <Star className="h-4 w-4 text-[#FF5A5C]" /> {t("mc.bp.badge")}
          </motion.span>
          <WordReveal as="h1" text={t("mc.bp.h1")} className="nv-display mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl" />
          <motion.p {...rise(0.25)} className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">{t("mc.bp.lead")}</motion.p>
          <motion.div {...rise(0.4)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#apply" className="nv-focus group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-[#1A2060] transition hover:bg-white/90">
              {t("mc.bp.start")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </a>
            <Link to="/contact?topic=partner" className="nv-focus inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
              <MessageCircle className="h-4 w-4" /> {t("mc.bp.talk")}
            </Link>
          </motion.div>
        </div>

        {ticker.length > 0 && (
          <div className="relative mt-14 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#1A2060] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#1A2060] to-transparent" />
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

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, k }) => (
            <StaggerItem key={k} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition duration-500 group-hover:bg-primary group-hover:text-white"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold text-slate-900">{t(`mc.bp.${k}.t`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{t(`mc.bp.${k}.d`)}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <WordReveal text={t("mc.bp.how")} className="nv-display mt-16 text-center text-3xl font-semibold text-slate-900" />
        <div className="relative mt-8">
          {/* Line that draws itself between the three steps (desktop only). */}
          <motion.div aria-hidden="true" className="absolute left-[16%] right-[16%] top-7 hidden h-px origin-left bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 sm:block" initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 1.4, ease: EASE }} />
          <Stagger className="relative grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, k }, i) => (
              <StaggerItem key={k} className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary ring-2 ring-primary">{i + 1}</span>
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{t(`mc.bp.${k}.t`).replace(/^\d+\.\s*/, "")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{t(`mc.bp.${k}.d`)}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-10 sm:px-6">
        <motion.div initial={reduced ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: 0.9, ease: EASE }}>
          <ApplicationSection />
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:flex-row sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t("mc.bp.q.t")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("mc.bp.q.d")}</p>
          </div>
          <Link to="/contact?topic=partner" className="nv-focus inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"><MessageCircle className="h-4 w-4" /> {t("mc.bp.talk")}</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
