import React from "react";
import { useCurrencies } from "@/hooks/useCurrencies";

/** Display-currency picker. Balances are stored in USD and converted for display. */
export default function CurrencySelect({ value, onChange, className = "", tone = "light" }) {
  const { currencies } = useCurrencies();
  const base = tone === "dark"
    ? "rounded-lg bg-white/15 px-2 py-1 text-xs text-white outline-none"
    : "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none";
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${base} ${className}`} aria-label="Devise d'affichage">
      {currencies.map((c) => (
        <option key={c.code} value={c.code} className="bg-white text-slate-900">{c.code}</option>
      ))}
    </select>
  );
}
