import React from "react";
import NelvinLogo from "@/components/NelvinLogo";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/i18n/I18nContext";

// Lifestyle imagery reused from the public hero assets (no generation needed).
const SAVANNA = "/images/savanna.webp";
const FOOD = "/images/categories/food-dining.webp";
const FITNESS = "/images/categories/fitness-sports.webp";
const BEAUTY = "/images/categories/beauty-care.webp";

export default function AuthLayout({ title, subtitle, footer, children }) {
  const { t } = useI18n();
  return (
    <div className="relative flex min-h-screen items-stretch justify-center bg-[radial-gradient(ellipse_at_top,_#F2EBDA_0%,_#FAF6EC_45%,_#ffffff_100%)]">
      <div className="grid w-full max-w-6xl min-h-screen lg:grid-cols-2">
        {/* Image panel — desktop only */}
        <div className="relative hidden overflow-hidden lg:block">
          <Image src={SAVANNA} fittingType="fill" className="absolute inset-0 h-full w-full animate-kenburns" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand/75 via-brand/45 to-[#08261D]/80" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex justify-center">
              <NelvinLogo className="h-12" />
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
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <NelvinLogo className="h-12" />
            </div>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="rounded-2xl border border-nv-line bg-card p-8 shadow-2xl shadow-slate-400/20">
              {children}
            </div>
            {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}