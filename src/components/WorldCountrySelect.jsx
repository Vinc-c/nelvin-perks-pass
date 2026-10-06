import React, { useMemo, useState } from "react";
import { AFRICAN_COUNTRIES } from "@/data/africanCountries";
import { ChevronDown, Search, Check, Globe } from "lucide-react";

// Single-country picker scoped to the 54 African countries Nelvin serves.
export default function WorldCountrySelect({ value, onChange, placeholder = "Sélectionnez un pays", className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = AFRICAN_COUNTRIES.find((c) => c.name === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AFRICAN_COUNTRIES;
    return AFRICAN_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center gap-2 rounded-lg border border-slate-200 bg-card px-3 text-left text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        {selected ? (
          <>
            <span className="text-xl leading-none">{selected.flag}</span>
            <span className="flex-1 truncate font-medium">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un pays…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-400">Aucun pays.</p>}
              {filtered.map((c) => (
                <button
                  type="button"
                  key={c.iso}
                  onClick={() => { onChange(c.name); setOpen(false); setQuery(""); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-slate-700">{c.name}</span>
                  {value === c.name && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}