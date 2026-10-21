import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import NelvinPassCard from "@/components/brand/NelvinPassCard";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";
import { usePlans } from "@/hooks/usePlans";

const GLYPH = { PASS_BASIC: "PASS_FREE", PASS_PREMIUM: "PASS_PREMIUM", PASS_VIP: "PASS_VIP" };
const PERK = { PASS_BASIC: "land.pass.basic", PASS_PREMIUM: "land.pass.premium", PASS_VIP: "land.pass.vip" };

/** Landing: the digital card and what each Pass unlocks (names and prices come from the live plans). */
export default function PassShowcase() {
  const { t } = useI18n();
  const { plans } = usePlans("B2C");
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative isolate mx-auto w-full max-w-md">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,_#E6CF8B66_0%,_transparent_70%)]" />
          <NelvinPassCard tier="PASS_VIP" illustration className="-rotate-3 shadow-black/30" />
          <NelvinPassCard tier="PASS_PREMIUM" illustration className="absolute left-6 top-24 -z-10 rotate-3 opacity-90 sm:left-10" />
          <div className="h-16 sm:h-20" aria-hidden="true" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <p className="text-sm font-semibold text-nv-bronze">{t("land.pass.kicker")}</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-nv-ink sm:text-4xl">{t("land.pass.title")}</h2>
          <p className="mt-3 max-w-xl text-nv-muted">
            {t("land.pass.text")}
          </p>
          <ul className="mt-6 space-y-3">
            {plans.map((p) => (
              <li key={p.code} className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-nv-line">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nv-ivory-2 text-nv-emerald ring-1 ring-nv-line">
                  <NvIcon name={GLYPH[p.code] || "PASS_FREE"} className="h-7 w-7" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-nv-ink">{p.name}</span>
                    <span className="text-sm font-semibold text-nv-bronze">${p.price_monthly}<span className="font-normal text-nv-muted">{t("land.pass.perMonth")}</span></span>
                  </span>
                  <span className="mt-0.5 block text-sm text-nv-muted">{PERK[p.code] ? t(PERK[p.code]) : p.tagline}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link to="/pricing" className="mt-6 inline-flex items-center rounded-full bg-nv-deep px-7 py-3 font-semibold text-white transition hover:bg-nv-emerald">
            {t("land.pass.compare")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
