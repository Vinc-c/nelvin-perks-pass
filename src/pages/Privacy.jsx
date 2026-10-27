import React from "react";
import LegalLayout, { LegalSection, rich, legalDate } from "@/components/LegalLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function Privacy() {
  const { t, locale } = useI18n();
  return (
    <LegalLayout
      title={t("lg.privacy.title")}
      updated={legalDate("2026-10-02", locale)}
      intro={t("lg.privacy.intro")}
    >
      <LegalSection title={t("lg.privacy.s1.t")}>
        <p>{rich(t("lg.privacy.s1.p1"))}</p>
        <p>{rich(t("lg.privacy.s1.p2"))}</p>
        <p>{rich(t("lg.privacy.s1.p3"))}</p>
        <p>{rich(t("lg.privacy.s1.p4"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s2.t")}>
        <p>{rich(t("lg.privacy.s2.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s3.t")}>
        <p>{rich(t("lg.privacy.s3.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s4.t")}>
        <p>{rich(t("lg.privacy.s4.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s5.t")}>
        <p>{rich(t("lg.privacy.s5.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s6.t")}>
        <p>{rich(t("lg.privacy.s6.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s7.t")}>
        <p>{rich(t("lg.privacy.s7.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.privacy.s8.t")}>
        <p>{rich(t("lg.privacy.s8.p1"))}</p>
      </LegalSection>
    </LegalLayout>
  );
}
