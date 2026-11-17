import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WordReveal } from "@/components/landing/motion";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

const STEPS = [
  { glyph: "PASS_FREE", id: 1 },
  { glyph: "PERK_GIFT", id: 2 },
  { glyph: "CASHBACK", id: 3 },
];

/** Landing: the three-step journey, in plain words. */
export default function HowItWorks() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
      <p className="text-center text-sm font-semibold text-nv-bronze">{t("land.how.kicker")}</p>
      <WordReveal text={t("land.how.title")} className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold text-nv-ink sm:text-4xl" />
      <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
        <motion.div aria-hidden="true" initial={reduced ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ transformOrigin: "left" }} className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[repeating-linear-gradient(90deg,#C8A24A_0_8px,transparent_8px_16px)] md:block" />
        {STEPS.map((s, i) => (
          <motion.li
            key={s.id}
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.25, duration: 0.6 }}
            className="relative text-center"
          >
            <motion.span whileHover={reduced ? undefined : { y: -6, rotate: -3 }} className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-nv-emerald shadow-lg shadow-nv-deep/10 ring-1 ring-nv-line">
              <NvIcon name={s.glyph} className="h-9 w-9" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-nv-deep text-xs font-bold text-nv-gold-light">{i + 1}</span>
            </motion.span>
            <h3 className="mt-5 text-lg font-bold text-nv-ink">{t(`land.how.${s.id}.t`)}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-nv-muted">{t(`land.how.${s.id}.d`)}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
