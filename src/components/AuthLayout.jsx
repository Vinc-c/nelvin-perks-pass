import React from "react";
import { Link } from "react-router-dom";
import NelvinLogo from "@/components/NelvinLogo";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/i18n/I18nContext";
import { usePublicContent, imageByKey } from "@/hooks/usePublicContent";
import { useCategories } from "@/hooks/useCategories";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BadgePercent, Building2, Lock, Wallet } from "lucide-react";

const PERKS = [[BadgePercent, "auth.perk1"], [Wallet, "auth.perk2"], [Building2, "auth.perk3"]];

// Lifestyle imagery reused from the public hero assets (no generation needed).
const SAVANNA_DEFAULT = "/images/savanna.webp";
const FOOD_DEFAULT = "/images/categories/food-dining.webp";
const FITNESS_DEFAULT = "/images/categories/fitness-sports.webp";
const BEAUTY_DEFAULT = "/images/categories/beauty-care.webp";

export default function AuthLayout({ title, subtitle, footer, children }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const rise = (delay = 0) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay } });
  const content = usePublicContent();
  const { categories } = useCategories();
  const cat = (v, fb) => categories.find((c) => c.value === v)?.image_url || fb;
  const SAVANNA = imageByKey(content?.images, "auth_background", SAVANNA_DEFAULT);
  const FOOD = cat("FOOD_DINING", FOOD_DEFAULT);
  const FITNESS = cat("FITNESS_SPORTS", FITNESS_DEFAULT);
  const BEAUTY = cat("BEAUTY_CARE", BEAUTY_DEFAULT);
  return (
    <div className="relative flex min-h-screen items-stretch justify-center bg-[radial-gradient(ellipse_at_top,_#F1F2FA_0%,_#FBFBFE_45%,_#ffffff_100%)]">
      <div className="grid w-full max-w-6xl min-h-screen lg:grid-cols-2">
        {/* Image panel — desktop only */}
        <div className="relative hidden overflow-hidden lg:block">
          <Image src={SAVANNA} fittingType="fill" className="absolute inset-0 h-full w-full animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand/75 via-brand/45 to-[#1A2060]/80" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex justify-center">
              <Link to="/" aria-label={t("auth.backHome")} className="nv-focus rounded transition hover:opacity-90"><NelvinLogo className="h-12" /></Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/30">
                <Image src={FOOD} fittingType="fill" className="h-40 w-full" />
              </div>
              <div className="mt-8 overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/30">
                <Image src={FITNESS} fittingType="fill" className="h-40 w-full" />
              </div>
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/30">
                <Image src={BEAUTY} fittingType="fill" className="h-40 w-full" />
              </div>
            </div>
            <div className="max-w-sm text-white">
              <h2 className="text-2xl font-bold leading-tight">{t("reg.panelTitle")}</h2>
              <p className="mt-3 text-sm text-white/80">{t("reg.panelText")}</p>
              <ul className="mt-5 space-y-2.5">
                {PERKS.map(([Icon, key], i) => (
                  <motion.li key={key} {...rise(0.3 + i * 0.12)} className="flex items-center gap-3 text-sm text-white/90">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    {t(key)}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col px-4 pb-10 pt-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="nv-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t("auth.home")}
            </Link>
            <LanguageSwitcher variant="light" compact />
          </div>
          <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <Link to="/" aria-label={t("auth.backHome")} className="nv-focus rounded"><NelvinLogo className="h-12" /></Link>
            </div>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <motion.div {...rise(0.05)} className="rounded-2xl border border-nv-line bg-card p-6 shadow-2xl shadow-slate-400/20 sm:p-8">
              {children}
            </motion.div>
            {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" />{t("auth.secure")}</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}