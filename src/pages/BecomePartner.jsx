import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Star, ArrowRight } from "lucide-react";
import PartnerApplicationForm from "@/components/partner/PartnerApplicationForm";
import { usePublicContent } from "@/hooks/usePublicContent";
import NelvinLogo, { NelvinMark } from "@/components/NelvinLogo";

const FALLBACK_TICKER = [
  { name: "MTN", domain: "mtn.com" },
  { name: "Jumia", domain: "jumia.com" },
  { name: "Safaricom", domain: "safaricom.co.ke" },
  { name: "Ecobank", domain: "ecobank.com" },
  { name: "Carrefour", domain: "carrefour.com" },
  { name: "Emirates", domain: "emirates.com" },
  { name: "Dangote", domain: "dangote.com" },
  { name: "M-Pesa", domain: "mpesa.co.ke" },
];

const initials = (name) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

function TickerLogo({ logo_url, domain, name }) {
  const [src, setSrc] = useState(logo_url || (domain ? `https://logo.clearbit.com/${domain}` : ""));
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      className="h-10 w-10 rounded-lg bg-white object-contain p-1"
      onError={() => {
        if (src.startsWith("https://logo.clearbit.com") && domain) {
          setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export default function BecomePartner() {
  const [menuOpen, setMenuOpen] = useState(false);
  const content = usePublicContent();
  const cmsLogos = (content?.logos || []).filter((l) => l.active !== false);
  const ticker = cmsLogos.length > 0 ? cmsLogos : FALLBACK_TICKER;
  const loop = [...ticker, ...ticker];

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900">
      {/* Nav over colored hero */}
      <header className="absolute top-0 left-0 right-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
             <NelvinMark className="h-9 w-9" />
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 lg:flex">
            <Link to="/merchant-directory" className="hover:text-white">Offers</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/" className="hover:text-white">Home</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-full px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">Log in</Link>
            <Link to="/register" className="hidden rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 sm:inline-flex">Get started</Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-white hover:bg-white/10 lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-white/10 bg-blue-700 px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1 text-sm font-medium text-white/90">
              <Link to="/merchant-directory" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-white/10">Offers</Link>
              <Link to="/pricing" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-white/10">Pricing</Link>
              <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-2.5 hover:bg-white/10">Home</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 rounded-full bg-white px-4 py-2.5 text-center font-semibold text-blue-700">Log in</Link>
            </nav>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 pb-16 pt-28 sm:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18),_transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25">
            <Star className="h-4 w-4 text-amber-300" /> Free to Join
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">Partner Application</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-50">
            Join 1,000+ brands already saving employees money every day. Listing your offer on Nelvin is free, fast, and fully managed.
          </p>
          <a href="#apply" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50">
            Start application <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Logo ticker */}
        <div className="relative mt-12 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-blue-700 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-blue-700 to-transparent" />
          <div className="flex w-max items-center gap-8 px-6 animate-marquee">
            {loop.map((b, i) => (
              <div key={`${b.name}-${i}`} className="flex items-center gap-2.5">
                <TickerLogo logo_url={b.logo_url} domain={b.domain} name={b.name} />
                <span className="text-sm font-semibold text-white/90">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <PartnerApplicationForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <NelvinLogo className="h-7" />
            </div>
            <p className="text-sm text-slate-400">© 2026 Nelvin Benefits — Built for Africa & MENA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}