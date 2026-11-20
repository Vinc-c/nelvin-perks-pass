import React from "react";
import LegalLayout, { legalDate } from "@/components/LegalLayout";
import RichText from "@/components/marketing/RichText";
import { Spinner } from "@/components/UiFeedback";
import PageNotFound from "@/lib/PageNotFound";
import { useLegalPage } from "@/hooks/useLegalPage";
import { useI18n } from "@/i18n/I18nContext";

function Dynamic({ page }) {
  const { locale } = useI18n();
  return (
    <LegalLayout title={page.title} updated={legalDate(page.updated_at, locale)}>
      <RichText text={page.body} />
    </LegalLayout>
  );
}

/** A legal page that shows the admin-edited text when one is published, otherwise the built-in text. */
export function withLegalOverride(slug, Static) {
  return function LegalPage() {
    const { loading, page } = useLegalPage(slug);
    if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
    return page ? <Dynamic page={page} /> : <Static />;
  };
}

/** /page/:slug — pages created from the admin (no built-in text). */
export function CustomPage({ slug }) {
  const { loading, page } = useLegalPage(slug);
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  return page ? <Dynamic page={page} /> : <PageNotFound />;
}
