import React from "react";
import { Link } from "react-router-dom";
import NelvinLogo from "@/components/NelvinLogo";
import { useI18n } from "@/i18n/I18nContext";
import { useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/landing/motion";

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
      { label: "foot.helpCenter", to: "/help-center" },
      { label: "foot.faq", to: "/#faq" },
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
  const reduced = useReducedMotion();
  return (
    <footer className="bg-nv-deep text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Stagger className="grid gap-10 lg:grid-cols-5">
          <StaggerItem className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded bg-white px-2 py-1">
              <NelvinLogo className="h-7" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              {t("foot.tagline")}
            </p>
          </StaggerItem>

          {columns.map((col) => (
            <StaggerItem key={col.title}>
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
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 sm:flex-row">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} {t("foot.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })} className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 transition hover:border-nv-gold-light hover:text-nv-gold-light"><ArrowUp className="h-3.5 w-3.5" />{t("foot.top")}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}