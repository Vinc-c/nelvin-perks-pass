import React, { useEffect } from "react";
import PricingCalculator from "@/components/PricingCalculator";
import MembershipPlans from "@/components/landing/MembershipPlans";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import KenteBand from "@/components/brand/KenteBand";

export default function Pricing() {
  useEffect(() => { document.title = "Tarifs du Pass Nelvin"; }, []);
  return (
    <div className="nv-body min-h-screen bg-slate-50 text-[#08261D]">
      <SiteHeader />
      <main>
        <section className="bg-[#08261D] text-white">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6">
            <h1 className="nv-display max-w-[18ch] text-4xl font-semibold leading-tight sm:text-5xl">Des tarifs simples, en mensuel ou en annuel</h1>
            <p className="mt-4 max-w-xl text-lg text-white/80">Pour les particuliers, les entreprises et les commerces partenaires. Prix affichés en USD, payables en monnaie locale par Mobile Money ou carte.</p>
          </div>
          <KenteBand height={14} />
        </section>
        <PricingCalculator />
        <MembershipPlans />
      </main>
      <SiteFooter />
    </div>
  );
}
