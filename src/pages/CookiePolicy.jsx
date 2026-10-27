import React from "react";
import LegalLayout, { LegalSection, rich, legalDate } from "@/components/LegalLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function CookiePolicy() {
  const { t, locale } = useI18n();
  return (
    <LegalLayout
      title={t("lg.cookies.title")}
      updated={legalDate("2026-10-02", locale)}
      intro={t("lg.cookies.intro")}
    >
      <LegalSection title={t("lg.cookies.s1.t")}>
        <p>{rich(t("lg.cookies.s1.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.cookies.s2.t")}>
        <p>{rich(t("lg.cookies.s2.p1"))}</p>
        <p>{rich(t("lg.cookies.s2.p2"))}</p>
        <p>{rich(t("lg.cookies.s2.p3"))}</p>
        <p>{rich(t("lg.cookies.s2.p4"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.cookies.s3.t")}>
        <p>{rich(t("lg.cookies.s3.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.cookies.s4.t")}>
        <p>{rich(t("lg.cookies.s4.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.cookies.s5.t")}>
        <p>{rich(t("lg.cookies.s5.p1"))}</p>
      </LegalSection>
    </LegalLayout>
  );
}
