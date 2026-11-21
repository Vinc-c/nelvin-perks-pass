import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Building2, Check, ChevronDown, LifeBuoy, Map, Menu, Store, Tag, User, Users, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NelvinLogo from "@/components/NelvinLogo";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

// One entry per audience: where each call to action lands is decided here, once.
const AUDIENCES = [
  { id: "ind", icon: User, cta: "/register?type=particulier" },
  { id: "hr", icon: Building2, cta: "/register?type=entreprise", link: "/demo" },
  { id: "emp", icon: Users, cta: "/join" },
  { id: "mer", icon: Store, cta: "/merchant" },
];
const DISCOVER = [
  { id: "offers", to: "/merchant-directory", icon: Tag },
  { id: "map", to: "/merchant-map", icon: Map },
  { id: "blog", to: "/blog", icon: BookOpen },
  { id: "help", to: "/help-center", icon: LifeBuoy },
];

/**
 * The one public header (outside the signed-in portals), on two layers:
 * a top bar (Solutions, Discover, Pricing, account buttons) and a panel under it
 * listing what each kind of account gets. Fixed to the top with a spacer, so it never scrolls away.
 * `minimal` keeps only logo, language and the account button (legal and access pages).
 */
export default function SiteHeader({ minimal = false }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(null); // "solutions" | "discover" | null
  const [menuOpen, setMenuOpen] = useState(false);
  const [acc, setAcc] = useState("solutions");
  const wrap = useRef(null);
  const timer = useRef(null);
  const isActive = (to) => pathname === to || pathname.startsWith(`${to}/`);

  useEffect(() => { setOpen(null); setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setOpen(null); setMenuOpen(false); } };
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, []);

  const hoverOpen = (id) => (e) => { if (e.pointerType === "touch") return; clearTimeout(timer.current); setOpen(id); };
  const hoverClose = (e) => { if (e.pointerType === "touch") return; clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), 160); };

  const cta = "nv-focus inline-flex h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-medium transition";
  const topBtn = (id) => `nv-focus flex items-center gap-1 rounded-full px-3.5 py-2 transition ${open === id ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`;
  const panelAnim = reduced ? {} : { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[600] border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Nelvin Benefits" className="nv-focus flex shrink-0 items-center rounded"><NelvinLogo className="h-10" /></Link>
          {!minimal && (
            <nav ref={wrap} className="hidden items-center gap-1 text-sm font-medium lg:flex" aria-label="Main navigation" onPointerLeave={hoverClose} onPointerEnter={() => clearTimeout(timer.current)}>
              <button type="button" className={topBtn("solutions")} aria-expanded={open === "solutions"} aria-controls="mm-solutions"
                onPointerEnter={hoverOpen("solutions")} onClick={() => setOpen(open === "solutions" ? null : "solutions")}>
                {t("mm.solutions")} <ChevronDown className={`h-4 w-4 transition-transform ${open === "solutions" ? "rotate-180" : ""}`} />
              </button>
              <div className="relative">
                <button type="button" className={topBtn("discover")} aria-expanded={open === "discover"} aria-controls="mm-discover"
                  onPointerEnter={hoverOpen("discover")} onClick={() => setOpen(open === "discover" ? null : "discover")}>
                  {t("mm.discover")} <ChevronDown className={`h-4 w-4 transition-transform ${open === "discover" ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {open === "discover" && (
                    <motion.div id="mm-discover" {...panelAnim} className="absolute start-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      {DISCOVER.map((d) => (
                        <Link key={d.id} to={d.to} className="nv-focus flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nv-emerald/10 text-nv-emerald"><d.icon className="h-4 w-4" /></span>
                          <span><span className="block text-sm font-semibold text-slate-900">{t(`mm.d.${d.id}`)}</span><span className="block text-xs font-normal text-slate-500">{t(`mm.d.${d.id}.sub`)}</span></span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/pricing" onPointerEnter={hoverOpen(null)} aria-current={isActive("/pricing") ? "page" : undefined}
                className={`nv-focus rounded-full px-3.5 py-2 transition ${isActive("/pricing") ? "bg-nv-emerald/10 text-nv-emerald" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{t("nav.pricing")}</Link>

              <AnimatePresence>
                {open === "solutions" && (
                  <motion.div id="mm-solutions" {...panelAnim} className="fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] border-b border-slate-200 bg-white shadow-xl">
                    <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-4">
                      {AUDIENCES.map((a, i) => (
                        <motion.div key={a.id} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}
                          className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-nv-emerald text-white"><a.icon className="h-5 w-5" /></span>
                          <h3 className="mt-3 text-base font-bold text-slate-900">{t(`mm.${a.id}.name`)}</h3>
                          <p className="mt-1 text-sm font-normal text-slate-500">{t(`mm.${a.id}.tag`)}</p>
                          <ul className="mt-3 space-y-2 text-sm font-normal text-slate-700">
                            {[1, 2, 3].map((n) => <li key={n} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-nv-emerald" />{t(`mm.${a.id}.b${n}`)}</li>)}
                          </ul>
                          <div className="mt-auto flex flex-col gap-2 pt-5">
                            <Link to={a.cta} className="nv-focus group inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-nv-emerald px-4 text-sm font-medium text-white hover:bg-nv-deep">
                              {t(`mm.${a.id}.cta`)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                            </Link>
                            {a.link && <Link to={a.link} className="nv-focus text-center text-sm font-medium text-nv-emerald hover:underline">{t(`mm.${a.id}.link`)}</Link>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
          <nav id="menu-mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-5 pt-2 lg:hidden" aria-label="Mobile navigation">
            <button type="button" aria-expanded={acc === "solutions"} onClick={() => setAcc(acc === "solutions" ? "" : "solutions")} className="nv-focus flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-slate-900">
              {t("mm.solutions")} <ChevronDown className={`h-5 w-5 transition-transform ${acc === "solutions" ? "rotate-180" : ""}`} />
            </button>
            {acc === "solutions" && (
              <div className="space-y-2 pb-2">
                {AUDIENCES.map((a) => (
                  <div key={a.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="flex items-center gap-2 font-bold text-slate-900"><a.icon className="h-4 w-4 text-nv-emerald" /> {t(`mm.${a.id}.name`)}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{t(`mm.${a.id}.tag`)}</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {[1, 2, 3].map((n) => <li key={n} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-nv-emerald" />{t(`mm.${a.id}.b${n}`)}</li>)}
                    </ul>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link to={a.cta} className="nv-focus inline-flex h-10 items-center rounded-full bg-nv-emerald px-4 text-sm font-medium text-white">{t(`mm.${a.id}.cta`)}</Link>
                      {a.link && <Link to={a.link} className="nv-focus text-sm font-medium text-nv-emerald">{t(`mm.${a.id}.link`)}</Link>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="button" aria-expanded={acc === "discover"} onClick={() => setAcc(acc === "discover" ? "" : "discover")} className="nv-focus flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-slate-900">
              {t("mm.discover")} <ChevronDown className={`h-5 w-5 transition-transform ${acc === "discover" ? "rotate-180" : ""}`} />
            </button>
            {acc === "discover" && (
              <div className="pb-2">
                {DISCOVER.map((d) => (
                  <Link key={d.id} to={d.to} className="nv-focus flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                    <d.icon className="h-4 w-4 text-nv-emerald" /><span><span className="block text-sm font-medium text-slate-900">{t(`mm.d.${d.id}`)}</span><span className="block text-xs text-slate-500">{t(`mm.d.${d.id}.sub`)}</span></span>
                  </Link>
                ))}
              </div>
            )}
            <Link to="/pricing" aria-current={isActive("/pricing") ? "page" : undefined} className={`nv-focus block rounded-xl px-3 py-3 text-base font-semibold ${isActive("/pricing") ? "bg-nv-emerald/10 text-nv-emerald" : "text-slate-900"}`}>{t("nav.pricing")}</Link>
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
