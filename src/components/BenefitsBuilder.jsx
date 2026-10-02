import React, { useState, useMemo } from "react";
import { useI18n } from "@/i18n/I18nContext";
import { SlidersHorizontal, Save, RotateCcw } from "lucide-react";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Operations", "HR"];
const CATEGORIES = [
  { key: "dining", label: "Dining", color: "emerald", max: 200 },
  { key: "health", label: "Health", color: "blue", max: 300 },
  { key: "sport", label: "Sport", color: "amber", max: 150 },
];

export default function BenefitsBuilder() {
  const { t } = useI18n();
  const [cycle, setCycle] = useState("monthly"); // monthly | yearly
  // allowances[department][category] = number
  const [allowances, setAllowances] = useState(() =>
    Object.fromEntries(
      DEPARTMENTS.map((d) => [d, { dining: 120, health: 200, sport: 80 }])
    )
  );

  const setVal = (dept, cat, val) =>
    setAllowances((prev) => ({ ...prev, [dept]: { ...prev[dept], [cat]: Number(val) } }));

  const reset = () =>
    setAllowances(Object.fromEntries(DEPARTMENTS.map((d) => [d, { dining: 120, health: 200, sport: 80 }])));

  const totals = useMemo(() => {
    const perCat = { dining: 0, health: 0, sport: 0 };
    DEPARTMENTS.forEach((d) => CATEGORIES.forEach((c) => (perCat[c.key] += allowances[d][c.key] || 0)));
    const grand = perCat.dining + perCat.health + perCat.sport;
    return { perCat, grand };
  }, [allowances]);

  const periodLabel = cycle === "monthly" ? t("pricing.monthly") : t("pricing.annual");
  const multiplier = cycle === "yearly" ? 12 : 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <SlidersHorizontal className="h-5 w-5 text-emerald-600" /> Flexible Benefits Builder
        </h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 p-0.5">
            {["monthly", "yearly"].map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${cycle === c ? "bg-emerald-500 text-white" : "text-slate-500"}`}
              >
                {c === "monthly" ? t("pricing.monthly") : t("pricing.annual")}
              </button>
            ))}
          </div>
          <button onClick={reset} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="pb-3 font-medium">Department</th>
              {CATEGORIES.map((c) => (
                <th key={c.key} className="pb-3 font-medium">{c.label}</th>
              ))}
              <th className="pb-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map((dept) => {
              const subtotal = CATEGORIES.reduce((acc, c) => acc + (allowances[dept][c.key] || 0), 0);
              return (
                <tr key={dept} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-900">{dept}</td>
                  {CATEGORIES.map((c) => (
                    <td key={c.key} className="py-3">
                      <input
                        type="range"
                        min={0}
                        max={c.max}
                        step={10}
                        value={allowances[dept][c.key]}
                        onChange={(e) => setVal(dept, c.key, e.target.value)}
                        className={`w-full accent-${c.color}-500`}
                      />
                      <span className="text-xs text-slate-500">${allowances[dept][c.key]}</span>
                    </td>
                  ))}
                  <td className="py-3 font-semibold text-slate-900">${subtotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100">
              <td className="pt-3 font-medium text-slate-500">Total / {periodLabel.toLowerCase()}</td>
              {CATEGORIES.map((c) => (
                <td key={c.key} className="pt-3 font-semibold text-slate-900">${totals.perCat[c.key]}</td>
              ))}
              <td className="pt-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  ${totals.grand * multiplier}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Allocations apply per employee in the selected department. {cycle === "yearly" ? "Annualized (×12)." : ""}
        </p>
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          <Save className="h-4 w-4" /> Save policy
        </button>
      </div>
    </div>
  );
}