import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Check, Users } from "lucide-react";
import { usePlans, annualSaving } from "@/hooks/usePlans";

const VIEWS = [
  { id: "B2B", label: "Entreprises" },
  { id: "B2C", label: "Particuliers" },
  { id: "MERCHANT", label: "Partenaires" },
];
const CTA = { B2B: ["/register", "Essai gratuit 30 jours"], B2C: ["/register", "Commencer"], MERCHANT: ["/merchant", "Devenir partenaire"] };

/** Pricing page: live plans with monthly/annual toggle and seat recommendation. */
export default function PricingCalculator() {
  const { plans } = usePlans();
  const [billing, setBilling] = useState("MONTHLY");
  const [view, setView] = useState("B2B");
  const [employees, setEmployees] = useState(10);
  const list = plans.filter((p) => p.audience === view);

  const recommended = useMemo(() => {
    if (view !== "B2B") return null;
    const sorted = [...list].sort((a, b) => (a.max_employees ?? Infinity) - (b.max_employees ?? Infinity));
    return sorted.find((p) => p.max_employees == null || employees <= p.max_employees) || sorted[sorted.length - 1];
  }, [list, view, employees]);

  const saving = Math.max(0, ...list.map(annualSaving));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {VIEWS.map((v) => (
            <button key={v.id} onClick={() => setView(v.id)} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${view === v.id ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>{v.label}</button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setBilling("MONTHLY")} className={`rounded-full px-6 py-2 text-sm font-semibold ${billing === "MONTHLY" ? "bg-emerald-500 text-white" : "text-slate-600"}`}>Mensuel</button>
          <button onClick={() => setBilling("ANNUAL")} className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold ${billing === "ANNUAL" ? "bg-emerald-500 text-white" : "text-slate-600"}`}>
            Annuel {saving > 0 && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">-{saving}%</span>}
          </button>
        </div>
      </div>

      {view === "B2B" && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-slate-700"><Users className="h-5 w-5 text-emerald-600" /> Nombre d'employés</span>
            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-lg font-bold text-emerald-700">{employees >= 100 ? "100+" : employees}</span>
          </div>
          <Slider value={[employees]} onValueChange={(v) => setEmployees(v[0])} min={1} max={100} step={1} className="mt-6" aria-label="Nombre d'employés" />
          {recommended && <p className="mt-4 text-sm text-slate-500">Plan recommandé : <span className="font-semibold text-emerald-600">{recommended.name}</span></p>}
        </div>
      )}

      <div className={`mt-8 grid gap-5 ${list.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {list.map((p) => {
          const price = billing === "ANNUAL" ? p.price_annual : p.price_monthly;
          const highlight = recommended ? recommended.code === p.code : p.popular;
          return (
            <motion.div key={p.code} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${highlight ? "border-emerald-500/60 ring-2 ring-emerald-500/30" : "border-slate-200"}`}>
              {highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">{recommended ? "Recommandé" : "Le plus choisi"}</span>}
              <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.tagline}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                <span className="mb-1.5 text-slate-400">{billing === "ANNUAL" ? "/an" : "/mois"}</span>
              </div>
              {billing === "ANNUAL" && <p className="mt-1 text-xs text-emerald-600">≈ ${Math.round(p.price_annual / 12)}/mois</p>}
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {(p.features || []).map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> {f}</li>)}
              </ul>
              <Link to={CTA[view][0]} className={`mt-6 block rounded-full py-3 text-center text-sm font-bold ${highlight ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{CTA[view][1]}</Link>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">Prix en USD hors taxes locales. Paiement par carte, Mobile Money ou virement selon votre pays.</p>
    </div>
  );
}
