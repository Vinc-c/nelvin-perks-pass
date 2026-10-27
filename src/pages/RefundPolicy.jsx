import React from "react";
import LegalLayout, { LegalSection, rich, legalDate } from "@/components/LegalLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function RefundPolicy() {
  const { t, locale } = useI18n();
  return (
    <LegalLayout
      title={t("lg.refund.title")}
      updated={legalDate("2026-10-02", locale)}
      intro={t("lg.refund.intro")}
    >
      <LegalSection title={t("lg.refund.s1.t")}>
        <p>{rich(t("lg.refund.s1.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.refund.s2.t")}>
        <p>{rich(t("lg.refund.s2.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.refund.s3.t")}>
        <p>{rich(t("lg.refund.s3.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.refund.s4.t")}>
        <p>{rich(t("lg.refund.s4.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.refund.s5.t")}>
        <p>{rich(t("lg.refund.s5.p1"))}</p>
      </LegalSection>
      <LegalSection title={t("lg.refund.s6.t")}>
        <p>{rich(t("lg.refund.s6.p1"))}</p>
      </LegalSection>
    </LegalLayout>
  );
}
