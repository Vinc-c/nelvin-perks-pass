import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { usePlans, annualSaving } from "@/hooks/usePlans";

const GRADIENTS = ["from-slate-600 to-slate-800", "from-amber-500 to-orange-600", "from-blue-500 to-indigo-700"];

/** Landing: B2C passes, priced from the live `plans` table. */
export default function MembershipPlans() {
  const { plans } = usePlans("B2C");
  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Choisissez votre Pass</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          Un abonnement donne accès à toutes les offres partenaires pendant sa durée. Prix en USD, payables en monnaie locale.
        </p>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 ${p.popular ? "md:scale-[1.03]" : ""}`}
            >
              <div className={`bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-6 text-white`}>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-white/80">{p.tagline}</p>
                <p className="mt-4 text-3xl font-extrabold">${p.price_monthly}<span className="text-base font-medium text-white/80">/mois</span></p>
                <p className="mt-1 text-xs text-white/80">ou ${p.price_annual}/an{annualSaving(p) > 0 ? ` (-${annualSaving(p)}%)` : ""}</p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <ul className="flex-1 space-y-3 text-sm text-slate-600">
                  {(p.features || []).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-3 w-3" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block rounded-full bg-slate-900 py-3 text-center font-semibold text-white transition hover:bg-slate-800">
                  Commencer
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">Entreprises : <Link to="/pricing" className="font-semibold text-emerald-600 hover:underline">30 jours d'essai gratuit</Link>, sans carte bancaire.</p>
      </div>
    </section>
  );
}
