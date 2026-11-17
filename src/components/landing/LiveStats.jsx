import React, { useMemo } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { Counter, Stagger, StaggerItem } from "@/components/landing/motion";

/** Real catalog numbers, counting up on scroll. Hidden while there is nothing to show. */
export default function LiveStats({ merchants = [], offers = [] }) {
  const { t } = useI18n();
  const stats = useMemo(() => {
    const cities = new Set(offers.map((o) => (o.city || "").trim().toLowerCase()).filter(Boolean));
    const cats = new Set(offers.map((o) => o.category).filter(Boolean));
    return [
      { k: "partners", v: merchants.length },
      { k: "offers", v: offers.length },
      { k: "cities", v: cities.size },
      { k: "categories", v: cats.size },
    ].filter((s) => s.v > 0);
  }, [merchants, offers]);
  if (stats.length < 2) return null;
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <Stagger className="grid grid-cols-2 gap-3 rounded-3xl bg-nv-deep p-6 text-white sm:p-8 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.k} className="text-center">
            <p className="text-4xl font-bold text-nv-gold-light sm:text-5xl"><Counter value={s.v} /></p>
            <p className="mt-1 text-sm text-white/70">{t(`land.stats.${s.k}`)}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
