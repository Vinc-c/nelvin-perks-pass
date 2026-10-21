import React from "react";
import { Link } from "react-router-dom";
import NelvinLogo from "@/components/NelvinLogo";
import { useI18n } from "@/i18n/I18nContext";

const columns = [
  {
    title: "foot.company",
    links: [
      { label: "foot.membership", to: "/pricing" },
      { label: "foot.vipKey", to: "/member" },
      { label: "foot.becomePartner", to: "/merchant" },
      { label: "foot.hr", to: "/hr" },
    ],
  },
  {
    title: "foot.help",
    links: [
      { label: "foot.faq", to: "/help-center" },
      { label: "foot.rules", to: "/terms" },
      { label: "foot.helpCenter", to: "/help-center" },
    ],
  },
  {
    title: "foot.legal",
    links: [
      { label: "foot.terms", to: "/terms" },
      { label: "foot.privacy", to: "/privacy" },
      { label: "foot.cookies", to: "/cookies" },
      { label: "foot.refund", to: "/refund-policy" },
    ],
  },
];


export default function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-nv-deep text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded bg-white px-2 py-1">
              <NelvinLogo className="h-7" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              {t("foot.tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-white">{t(col.title)}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-white/70 transition-colors hover:text-nv-gold-light">
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} {t("foot.copy")}{" "}
            <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="font-medium text-white/70 hover:text-nv-gold-light">liafrik.com</a>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
            <Link to="/terms" className="hover:text-nv-gold-light">{t("foot.termsShort")}</Link>
            <Link to="/privacy" className="hover:text-nv-gold-light">{t("foot.privacyShort")}</Link>
            <Link to="/cookies" className="hover:text-nv-gold-light">{t("foot.cookiesShort")}</Link>
            <Link to="/refund-policy" className="hover:text-nv-gold-light">{t("foot.refundShort")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}