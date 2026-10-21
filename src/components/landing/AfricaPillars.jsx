import React from "react";
import { motion } from "framer-motion";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

const PILLARS = [
  { glyph: "MOBILE_MONEY", id: "pay" },
  { glyph: "PIN_CODE", id: "pin" },
  { glyph: "OFFLINE", id: "offline" },
  { glyph: "WHATSAPP", id: "share" },
  { glyph: "CITY_PIN", id: "city" },
  { glyph: "VERIFIED", id: "verified" },
];

/** Landing: what makes Nelvin different from imported discount clubs. */
export default function AfricaPillars() {
  const { t } = useI18n();
  return (
    <section className="relative mt-24 overflow-hidden bg-nv-deep py-20 text-white">
      <NvIcon name="AFRICA" tone="dark" strokeWidth={0.18} className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-nv-gold" faint={0.1} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-semibold text-nv-gold-light">{t("land.africa.kicker")}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{t("land.africa.title")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nv-gold/15 text-white ring-1 ring-nv-gold/30">
                <NvIcon name={p.glyph} tone="dark" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{t(`land.africa.${p.id}.t`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{t(`land.africa.${p.id}.d`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
