import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nContext";

/** Renders <b>…</b> markers of a translated string as bold text. */
export const rich = (s) => s.split(/<\/?b>/).map((x, i) => (i % 2 ? <strong key={i}>{x}</strong> : x));
export const legalDate = (iso, locale) => new Date(iso).toLocaleDateString(locale, { dateStyle: "long" });

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function LegalLayout({ title, updated, intro, children }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-amber-600">
              <ArrowLeft className="h-4 w-4" /> {t("lg.back")}
            </Link>
            <LanguageSwitcher compact variant="light" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {updated && <p className="mt-2 text-sm text-slate-400">{t("lg.updated", { date: updated })}</p>}
          {intro && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">{intro}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}