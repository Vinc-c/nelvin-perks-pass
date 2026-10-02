import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Check, Users, Sparkles, TrendingUp } from "lucide-react";

const hrPlans = [
  {
    id: "starter",
    name: "Starter",
    range: "0–15 employees",
    monthly: 79,
    annual: 805,
    features: ["Up to 15 employee seats", "Core benefits wallet", "QR redemption", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    range: "15–59 employees",
    monthly: 129,
    annual: 1315,
    features: ["Up to 59 seats", "Flexible benefits builder", "HR analytics dashboard", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    range: "60+ employees",
    monthly: 189,
    annual: 1927,
    features: ["Unlimited seats", "SSO & dedicated support", "Multi-currency engine", "Custom integrations"],
  },
];

const b2cPlans = [
  { id: "basic", name: "Pass Basic", monthly: 9, features: ["200+ dining offers", "1 city", "Standard cashback"] },
  { id: "premium", name: "Pass Premium", monthly: 19, features: ["1,500+ offers", "All cities", "Boosted cashback"], popular: true },
  { id: "vip", name: "Pass VIP", monthly: 39, features: ["5,000+ offers", "VIP lifestyle collections", "Max cashback & hotels"] },
];

export default function PricingCalculator() {
  const [billing, setBilling] = useState("monthly");
  const [employees, setEmployees] = useState(5);
  const [view, setView] = useState("hr");

  const activeHr = useMemo(
    () => (employees < 15 ? hrPlans[0] : employees < 60 ? hrPlans[1] : hrPlans[2]),
    [employees]
  );

  const empLabel = employees >= 100 ? "100+" : String(employees);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${billing === "monthly" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition ${billing === "annual" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
          >
            Annual <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">-15%</span>
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setView("hr")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${view === "hr" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            HR & Corporate
          </button>
          <button
            onClick={() => setView("b2c")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${view === "b2c" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            B2C Member Passes
          </button>
        </div>
      </div>

      {/* HR Calculator */}
      {view === "hr" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Number of employees</span>
              </div>
              <div className="rounded-full bg-blue-50 px-4 py-1.5 text-lg font-bold text-blue-700">
                {empLabel} <span className="text-sm font-medium text-slate-400">employees</span>
              </div>
            </div>
            <div className="mt-6 px-1">
              <Slider
                value={[employees]}
                onValueChange={(v) => setEmployees(v[0])}
                min={0}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-400"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>0</span>
                <span>50</span>
                <span>100+</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Recommended plan: <span className="font-semibold text-emerald-600">{activeHr.name}</span> ({activeHr.range})
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {hrPlans.map((plan) => {
              const active = plan.id === activeHr.id;
              const price = billing === "monthly" ? plan.monthly : plan.annual;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-3xl border bg-white p-6 shadow-sm transition ${
                    active ? "border-emerald-500/60 ring-2 ring-emerald-500/30" : "border-slate-200"
                  }`}
                >
                  {active && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.range}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                    <span className="mb-1.5 text-slate-400">{billing === "monthly" ? "/mo" : "/yr"}</span>
                  </div>
                  {billing === "annual" && (
                    <p className="mt-1 text-xs text-emerald-600">≈ ${Math.round(price / 12)}/mo billed annually</p>
                  )}
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/hr"
                    className={`mt-6 block rounded-full py-3 text-center text-sm font-bold transition ${
                      active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Select Plan
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* B2C Member Passes */}
      {view === "b2c" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
          <div className="grid gap-5 md:grid-cols-3">
            {b2cPlans.map((plan) => {
              const monthly = billing === "annual" ? Math.round(plan.monthly * 0.85 * 100) / 100 : plan.monthly;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-3xl border bg-white p-6 shadow-sm transition ${
                    plan.popular ? "border-amber-500/50 ring-2 ring-amber-500/30" : "border-slate-200"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">${monthly}</span>
                    <span className="mb-1.5 text-slate-400">/mo</span>
                  </div>
                  {billing === "annual" && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                      <Sparkles className="h-3 w-3" /> 15% off — billed annually
                    </p>
                  )}
                  <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/member"
                    className="mt-6 block rounded-full bg-emerald-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
                  >
                    Select Plan
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-500">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> All passes include Buy 1 Get 1 Free offers & wallet cashback.
          </p>
        </motion.div>
      )}
    </div>
  );
}