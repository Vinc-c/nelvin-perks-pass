import React, { useState } from "react";
import { Link } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NelvinLogo from "@/components/NelvinLogo";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

/** Public site header shared by the landing, partner and pricing pages. */
export default function SiteHeader() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { to: "/merchant-directory", label: t("nav.offers") },
    { to: "/merchant-map", label: t("nav.map") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/merchant", label: t("nav.merchants") },
  ];

  return (
    <header className="sticky top-0 z-[600] border-b border-white/10 bg-[#08261D]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="nv-focus flex items-center rounded bg-white px-2 py-1"><NelvinLogo className="h-8" /></Link>
        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex" aria-label="Navigation principale">
          {nav.map((n) => <Link key={n.to} to={n.to} className="nv-focus rounded-full px-4 py-2 text-white/85 hover:bg-white/10 hover:text-white">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSwitcher compact variant="dark" /></div>
          {isAuthenticated ? (
            <Link to="/app" className="nv-focus rounded-full bg-[#C8A24A] px-5 py-2 text-sm font-semibold text-[#08261D] hover:bg-[#E6CF8B]">{t("nav.mySpace")}</Link>
          ) : (
            <>
              <Link to="/login" className="nv-focus hidden rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">{t("cta.login")}</Link>
              <Link to="/register" className="nv-focus whitespace-nowrap rounded-full bg-[#C8A24A] px-4 py-2 text-sm font-semibold text-[#08261D] hover:bg-[#E6CF8B] sm:px-5">{t("cta.getStarted")}</Link>
            </>
          )}
          <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="menu-mobile" className="nv-focus rounded-full px-3 py-2 text-sm font-semibold hover:bg-white/10 lg:hidden">
            {menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="menu-mobile" className="border-t border-white/10 px-4 pb-4 lg:hidden" aria-label="Navigation mobile">
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="nv-focus block rounded-lg px-3 py-3 font-medium hover:bg-white/10">{n.label}</Link>)}
          {!isAuthenticated && <Link to="/login" onClick={() => setMenuOpen(false)} className="nv-focus block rounded-lg px-3 py-3 font-medium hover:bg-white/10">{t("cta.login")}</Link>}
          <div className="px-3 pt-2"><LanguageSwitcher variant="dark" /></div>
        </nav>
      )}
    </header>
  );
}
