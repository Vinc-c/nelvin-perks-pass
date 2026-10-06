import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import CheckoutModal from "@/components/CheckoutModal";
import { useAuth } from "@/lib/AuthContext";
import { usePlans, annualSaving } from "@/hooks/usePlans";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { Check, Crown, Sparkles } from "lucide-react";

export function audienceFor(user) {
  if (user?.role === "HR_ADMIN") return "B2B";
  if (user?.role === "MERCHANT") return "MERCHANT";
  return "B2C";
}

const TITLES = {
  B2C: ["Choisissez votre Pass", "Toutes les offres partenaires, du cashback sur chaque échange."],
  B2B: ["Plans entreprise", "Un forfait par entreprise — invitez vos employés selon les sièges du plan."],
  MERCHANT: ["Plans partenaires", "Développez votre clientèle avec Nelvin."],
};

export default function MembershipTiers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const audience = audienceFor(user);
  const { plans } = usePlans(audience);
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [cycle, setCycle] = useState("MONTHLY");
  const [selected, setSelected] = useState(null);
  const [title, subtitle] = TITLES[audience];
  const maxSaving = Math.max(0, ...plans.map(annualSaving));

  return (
    <PortalLayout title="Abonnement" theme="light">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{subtitle} Prix en USD, affichés en {currency}.</p>
        <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setCycle("MONTHLY")} className={`rounded-full px-5 py-2 text-sm font-semibold ${cycle === "MONTHLY" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Mensuel</button>
          <button onClick={() => setCycle("ANNUAL")} className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${cycle === "ANNUAL" ? "bg-slate-900 text-white" : "text-slate-600"}`}>
            Annuel {maxSaving > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">-{maxSaving}%</span>}
          </button>
        </div>
      </div>

      <div className={`grid gap-5 ${plans.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} mx-auto max-w-6xl`}>
        {plans.map((p, i) => {
          const usd = cycle === "ANNUAL" ? p.price_annual : p.price_monthly;
          return (
            <motion.div key={p.code} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${p.popular ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Le plus choisi</span>}
              <div className="flex items-center gap-2">
                {p.popular ? <Sparkles className="h-5 w-5 text-amber-500" /> : i === plans.length - 1 ? <Crown className="h-5 w-5 text-amber-500" /> : null}
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
              </div>
              {p.tagline && <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>}
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">{money.format(usd, currency)}</span>
                <span className="mb-1.5 text-slate-400">/{cycle === "ANNUAL" ? "an" : "mois"}</span>
              </div>
              {cycle === "ANNUAL" && annualSaving(p) > 0 && <p className="text-xs text-emerald-600">soit {money.format(p.price_annual / 12, currency)}/mois — {annualSaving(p)}% d'économie</p>}
              {p.max_employees != null && audience === "B2B" && <p className="mt-1 text-xs text-slate-500">Jusqu'à {p.max_employees} employés</p>}
              <ul className="mt-5 flex-1 space-y-2">
                {(p.features || []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>
                ))}
              </ul>
              <button
                onClick={() => (user ? setSelected(p) : navigate("/register"))}
                className={`mt-6 rounded-full py-3 text-sm font-bold transition ${p.popular ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                Choisir {p.name}
              </button>
            </motion.div>
          );
        })}
      </div>

      <CheckoutModal open={!!selected} plan={selected} cycle={cycle} purpose="SUBSCRIPTION" onClose={() => setSelected(null)} onPaid={() => navigate("/billing-settings")} />
    </PortalLayout>
  );
}
