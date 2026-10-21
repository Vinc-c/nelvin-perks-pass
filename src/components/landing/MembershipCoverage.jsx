import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { OFFER_CATEGORIES } from "@/data/offerCategories";
import { useI18n } from "@/i18n/I18nContext";
import { CATEGORY_IMAGES as categoryImages } from "@/data/categoryImages";

const keys = OFFER_CATEGORIES.map((c) => c.value);

function Card({ k, hidden }) {
  const { t } = useI18n();
  return (
    <Link
      to={`/merchant-directory?category=${k}`}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="group block w-64 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-nv-line transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-32 w-full">
        <Image src={categoryImages[k]} fittingType="fill" className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-nv-gold px-2.5 py-1 text-[11px] font-bold text-nv-ink shadow">{t("land.memberOffer")}</span>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-nv-ink">{t(`cat.${k}`)}</p>
        <p className="mt-1 text-xs leading-relaxed text-nv-muted">{t(`catd.${k}`)}</p>
      </div>
    </Link>
  );
}

function Row({ items, reverse }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#FAF6EC] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#FAF6EC] to-transparent" />
      <div className={`flex w-max gap-4 px-2 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {loop.map((k, i) => <Card key={`${k}-${i}`} k={k} hidden={i >= items.length} />)}
      </div>
    </div>
  );
}

export default function MembershipCoverage() {
  const { t } = useI18n();
  const rowA = keys.slice(0, 8);
  const rowB = keys.slice(8);
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center text-2xl font-bold text-nv-ink sm:text-3xl">{t("land.cover.title")}</motion.h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-nv-muted">{t("land.cover.sub")}</p>
      </div>
      <div className="mt-8 space-y-4">
        <Row items={rowA} />
        <Row items={rowB} reverse />
      </div>
      <div className="mt-10 text-center">
        <Link to="/merchant-directory" className="inline-flex items-center justify-center rounded-full bg-nv-emerald px-8 py-3.5 font-semibold text-white shadow-lg shadow-nv-emerald/30 transition hover:bg-nv-deep">
          {t("land.cover.all")}
        </Link>
      </div>
    </section>
  );
}