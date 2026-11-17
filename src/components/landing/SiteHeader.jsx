import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NelvinLogo from "@/components/NelvinLogo";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

/**
 * The one public header: same bar, logo, language menu, buttons and mobile menu on every page
 * outside the signed-in portals. Fixed to the top with a spacer, so it never scrolls away.
 * `minimal` keeps only logo, language and the account button (legal and access pages).
 */
export default function SiteHeader({ minimal = false }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { to: "/merchant-directory", label: t("nav.offers") },
    { to: "/merchant-map", label: t("nav.map") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/merchant", label: t("nav.merchants") },
    { to: "/blog", label: t("nav.blog") },
    { to: "/demo", label: t("nav.demo") },
  ];
  const isActive = (to) => pathname === to || pathname.startsWith(`${to}/`);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const cta = "nv-focus inline-flex h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-medium transition";
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[600] border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Nelvin Benefits" className="nv-focus flex shrink-0 items-center rounded"><NelvinLogo className="h-10" /></Link>
          {!minimal && (
            <nav className="hidden items-center gap-1 text-sm font-medium lg:flex" aria-label="Main navigation">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} aria-current={isActive(n.to) ? "page" : undefined}
                  className={`nv-focus rounded-full px-3.5 py-2 transition ${isActive(n.to) ? "bg-nv-emerald/10 text-nv-emerald" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{n.label}</Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact variant="light" />
            {isAuthenticated ? (
              <Link to="/app" className={`${cta} bg-nv-emerald text-white hover:bg-nv-deep`}>{t("nav.mySpace")}</Link>
            ) : (
              !minimal && (
                <>
                  <Link to="/login" className={`${cta} hidden text-slate-800 hover:bg-slate-100 sm:inline-flex`}>{t("cta.login")}</Link>
                  <Link to="/register" className={`${cta} hidden bg-nv-emerald text-white hover:bg-nv-deep sm:inline-flex`}>{t("cta.getStarted")}</Link>
                </>
              )
            )}
            {!minimal && (
              <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="menu-mobile"
                aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                className="nv-focus flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 lg:hidden">
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
        {!minimal && menuOpen && (
          <nav id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-5 pt-3 lg:hidden" aria-label="Mobile navigation">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} aria-current={isActive(n.to) ? "page" : undefined}
                className={`nv-focus block rounded-xl px-3 py-3 text-base font-medium ${isActive(n.to) ? "bg-nv-emerald/10 text-nv-emerald" : "text-slate-800 hover:bg-slate-50"}`}>{n.label}</Link>
            ))}
            {!isAuthenticated && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/login" className="nv-focus flex h-11 items-center justify-center rounded-xl border border-slate-300 text-sm font-medium text-slate-800">{t("cta.login")}</Link>
                <Link to="/register" className="nv-focus flex h-11 items-center justify-center rounded-xl bg-nv-emerald text-sm font-medium text-white">{t("cta.getStarted")}</Link>
              </div>
            )}
          </nav>
        )}
      </header>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-top))]" />
    </>
  );
}
