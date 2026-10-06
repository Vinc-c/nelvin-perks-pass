import React from "react";
import { Link } from "react-router-dom";
import KenteBand from "@/components/brand/KenteBand";
import { NelvinMark } from "@/components/NelvinLogo";

const columns = [
  {
    title: "Nelvin",
    links: [
      { label: "Les offres", to: "/merchant-directory" },
      { label: "Carte des partenaires", to: "/merchant-map" },
      { label: "Tarifs du Pass", to: "/pricing" },
      { label: "Inscrire mon commerce", to: "/merchant" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Centre d'aide", to: "/help-center" },
      { label: "Règles d'utilisation", to: "/terms" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", to: "/terms" },
      { label: "Confidentialité", to: "/privacy" },
      { label: "Cookies", to: "/cookies" },
      { label: "Remboursement et annulation", to: "/refund-policy" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="nv-body bg-[#0E1A3B] text-white">
      <KenteBand height={12} />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="nv-focus inline-flex items-center gap-3 rounded">
              <NelvinMark className="h-11 w-11" />
              <span className="nv-display text-xl font-semibold">Nelvin</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Le pass des bons plans et des avantages salariés, pensé pour les villes africaines.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-[#D4A13A]">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="nv-focus rounded text-white/75 hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Nelvin Benefits</p>
          <p>
            Plateforme développée par{" "}
            <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="nv-focus rounded font-semibold text-white hover:text-[#D4A13A]">liafrik.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
