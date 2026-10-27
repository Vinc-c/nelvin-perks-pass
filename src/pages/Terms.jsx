import React from "react";
import LegalLayout, { LegalSection, rich, legalDate } from "@/components/LegalLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function Terms() {
  const { t, locale } = useI18n();
  return (
    <LegalLayout
      title={t("lg.terms.title")}
      updated={legalDate("2026-10-02", locale)}
      intro={t("lg.terms.intro")}
    >
      <LegalSection title={t("lg.terms.s1.t")}>
        <p>{rich(t("lg.terms.s1.p1"))}</p>
        <p>{rich(t("lg.terms.s1.p2"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s2.t")}>
        <p>{rich(t("lg.terms.s2.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s3.t")}>
        <p>{rich(t("lg.terms.s3.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s4.t")}>
        <p>{rich(t("lg.terms.s4.p1"))}</p>
        <p>{rich(t("lg.terms.s4.p2"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s5.t")}>
        <p>{rich(t("lg.terms.s5.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s6.t")}>
        <p>{rich(t("lg.terms.s6.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s7.t")}>
        <p>{rich(t("lg.terms.s7.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s8.t")}>
        <p>{rich(t("lg.terms.s8.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.terms.s9.t")}>
        <p>{rich(t("lg.terms.s9.p1"))}</p>
      </LegalSection>
    </LegalLayout>
  );
}
