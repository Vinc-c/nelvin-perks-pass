import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/i18n/I18nContext";
import { useCategories } from "@/hooks/useCategories";
import { categoryImage } from "@/data/offerCategories";
import { Stagger, StaggerItem, WordReveal } from "@/components/landing/motion";

/** Landing: every category as an image card (live offer count), linking to the partner directory. */
export default function IndustriesGrid({ counts = {} }) {
  const { t } = useI18n();
  const { categories } = useCategories();
  const list = categories.slice(0, 8);
  if (!list.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
      <p className="text-center text-sm font-semibold text-nv-bronze">{t("land.ind.kicker")}</p>
      <WordReveal text={t("land.ind.title")} className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold text-nv-ink sm:text-4xl" />
      <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {list.map((c) => (
          <StaggerItem key={c.value}>
            <Link to={`/merchant-directory?category=${c.value}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-slate-200 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl">
              <Image src={c.image_url || categoryImage(c.value)} alt="" className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-nv-ink opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100"><ArrowUpRight className="h-4 w-4" /></span>
              <span className="absolute inset-x-4 bottom-4 text-white">
                <span className="block text-lg font-bold leading-tight">{c.emoji} {c.label}</span>
                {counts[c.value] ? <span className="mt-0.5 block text-xs text-white/80">{t("land.ind.offers", { n: counts[c.value] })}</span> : null}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
