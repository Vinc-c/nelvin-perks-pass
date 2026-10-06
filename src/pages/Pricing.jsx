import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PricingCalculator from "@/components/PricingCalculator";
import NelvinLogo from "@/components/NelvinLogo";
import MembershipPlans from "@/components/landing/MembershipPlans";

export default function Pricing() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <NelvinLogo className="h-8" />
          </Link>
          <LanguageSwitcher compact variant="light" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-12">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center text-3xl font-bold sm:text-4xl">Des tarifs simples et transparents</motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mx-auto mt-3 max-w-xl text-center text-slate-500">Mensuel ou annuel, pour les entreprises, les particuliers et les partenaires. Prix en USD, payables en monnaie locale.</motion.p>
      </div>
      <PricingCalculator />
      <MembershipPlans />
    </div>
  );
}