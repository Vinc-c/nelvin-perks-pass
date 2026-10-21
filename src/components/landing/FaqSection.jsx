import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n/I18nContext";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const FAQ_IDS = [1, 2, 3, 4, 5];

export default function FaqSection() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-nv-ink sm:text-4xl">{t("land.faq.title")}</h2>
          <p className="mt-3 text-nv-muted">{t("land.faq.sub")}</p>
          <Link to="/help-center" className="mt-6 inline-flex items-center justify-center rounded-full border border-nv-line bg-white px-7 py-3 font-semibold text-nv-ink transition hover:bg-nv-ivory-2">
            {t("land.faq.all")}
          </Link>
        </div>
        <div className="lg:col-span-3">
          <Accordion type="single" collapsible defaultValue="item-0" className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-nv-line">
            {FAQ_IDS.map((n, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="px-4">
                <AccordionTrigger className="text-left text-base font-semibold text-nv-ink">{t(`land.faq.${n}.q`)}</AccordionTrigger>
                <AccordionContent className="text-nv-muted">{t(`land.faq.${n}.a`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}