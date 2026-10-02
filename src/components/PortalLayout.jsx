import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { navFor, navHref, isNavActive } from "@/lib/portalNav";
import LanguageSwitcher from "./LanguageSwitcher";
import PortalNavLinks from "./PortalNavLinks";
import PortalUserCard from "./PortalUserCard";
import NelvinSupportWidget from "@/components/NelvinSupportWidget";
import { Menu, X } from "lucide-react";
import NelvinLogo from "@/components/NelvinLogo";

const Logo = ({ to }) => (
  <Link to={to} className="flex items-center gap-2">
    <NelvinLogo className="h-8" />
  </Link>
);

export default function PortalLayout({ children, title }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const items = navFor(user, location.pathname, location.search);

  // Public visitors (browsing the merchant directory / map from the landing
  // page) get a lightweight header instead of the authenticated portal chrome.
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Logo to="/" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher compact variant="light" />
              {isAuthenticated ? (
                <Link to="/app" className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">Log in</Link>
                  <Link to="/register" className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white">Get started</Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10">
          {title && <h1 className="mb-4 text-2xl font-bold text-slate-900">{title}</h1>}
          {children}
        </main>
        <NelvinSupportWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center px-6"><Logo to={items[0].to} /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <PortalNavLinks items={items} />
        </nav>
        <div className="border-t border-slate-200 p-3"><PortalUserCard /></div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Logo to={items[0].to} />
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact variant="light" />
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="rounded-full p-2 hover:bg-slate-100">
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileNavOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-4"
            >
              <div className="mb-4 px-2"><Logo to={items[0].to} /></div>
              <nav className="flex-1 space-y-1 overflow-y-auto"><PortalNavLinks items={items} onNavigate={() => setMobileNavOpen(false)} /></nav>
              <PortalUserCard />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="md:pl-64">
        <div className="hidden h-16 items-center justify-between px-8 md:flex">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <LanguageSwitcher variant="light" />
        </div>
        <main className="px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 md:hidden">
        {items.slice(0, 5).map((item, i) => {
          const Icon = item.icon;
          const active = isNavActive(item, location.pathname, location.search);
          return (
            <Link key={`${item.to}-${item.section || ""}-${i}`} to={navHref(item)} className={`flex flex-col items-center gap-1 rounded-full px-2 py-1.5 text-xs ${active ? "text-amber-700" : "text-slate-500"}`}>
              <Icon className="h-5 w-5" />
              <span className="max-w-[64px] truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <NelvinSupportWidget />
    </div>
  );
}