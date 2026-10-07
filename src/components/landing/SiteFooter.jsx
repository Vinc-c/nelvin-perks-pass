import React from "react";
import { Link } from "react-router-dom";
import NelvinLogo from "@/components/NelvinLogo";

const columns = [
  {
    title: "Société",
    links: [
      { label: "Adhésion", to: "/pricing" },
      { label: "VIP Key", to: "/member" },
      { label: "Devenir Partenaire", to: "/merchant" },
      { label: "Espace Entreprise / RH", to: "/hr" },
    ],
  },
  {
    title: "Aide & Support",
    links: [
      { label: "FAQs", to: "/help-center" },
      { label: "Règles d'utilisation", to: "/terms" },
      { label: "Centre d'aide", to: "/help-center" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", to: "/terms" },
      { label: "Politique de confidentialité", to: "/privacy" },
      { label: "Politique des cookies", to: "/cookies" },
      { label: "Remboursement & annulation", to: "/refund-policy" },
    ],
  },
];


export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <NelvinLogo className="h-7" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              Avantages et économies conçus pour tous, à travers les villes africaines.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-slate-900">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-slate-500 transition-colors hover:text-amber-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Nelvin Benefits, conçu pour l'Afrique. Développé par{" "}
            <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-500 hover:text-amber-600">liafrik.com</a>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
            <Link to="/terms" className="hover:text-amber-600">Conditions</Link>
            <Link to="/privacy" className="hover:text-amber-600">Confidentialité</Link>
            <Link to="/cookies" className="hover:text-amber-600">Cookies</Link>
            <Link to="/refund-policy" className="hover:text-amber-600">Remboursement</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}