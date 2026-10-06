import React, { useMemo, useState } from "react";
import { Search, Check, X } from "lucide-react";
import { AFRICAN_REGIONS, AFRICAN_COUNTRIES } from "@/data/africanCountries";

// All 54 African countries grouped by AU region — Nelvin only serves Africa.
export default function AfricanCountrySelect({ value, onChange }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AFRICAN_REGIONS;
    return AFRICAN_REGIONS.map((r) => ({
      ...r,
      countries: r.countries.filter((c) => c.toLowerCase().includes(q)),
    })).filter((r) => r.countries.length > 0);
  }, [query]);

  const toggle = (c) =>
    onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);

  return (
    <div>
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-[#0E1A3B] px-3 py-1.5 text-sm font-medium text-white">
              {c}
              <button type="button" onClick={() => toggle(c)} className="rounded-full hover:bg-[#27306E]">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un pays…"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#0E1A3B] focus:ring-2 focus:ring-[#0E1A3B]/10"
        />
      </div>

      {/* Grouped list */}
      <div className="mt-3 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        {filtered.length === 0 && (
          <p className="flex items-center gap-2 py-6 text-center text-sm text-slate-400">
            Aucun pays trouvé.
          </p>
        )}
        {filtered.map((region) => (
          <div key={region.name}>
            <p className="mb-2 text-xs font-semibold text-slate-500">{region.name}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {region.countries.map((c) => {
                const active = value.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggle(c)}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      active ? "border-[#0E1A3B] bg-[#EEF1F7] text-[#0E1A3B]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${active ? "border-[#0E1A3B] bg-[#0E1A3B]" : "border-slate-300"}`}>
                      {active && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">{value.length} / {AFRICAN_COUNTRIES.length} pays sélectionnés — Nelvin ne couvre que l'Afrique.</p>
    </div>
  );
}