import React, { useMemo, useState } from "react";
import { AFRICAN_COUNTRIES, findAfricanCountry } from "@/data/africanCountries";
import { ChevronDown, Search, Phone } from "lucide-react";

// Professional phone input: African country flag + dial code dropdown + national number.
// Value is stored as a single string "E.164-ish": "+<dial> <number>".
export default function PhoneInput({ value, onChange, placeholder = "6XX XXX XXX", className = "", required }) {
  // Parse the incoming value into a country (by dial prefix) and a national number.
  const parsed = useMemo(() => {
    const v = (value || "").trim();
    if (!v) return { iso: "CM", num: "" };
    const digits = v.replace(/[^\d]/g, "");
    // Try the longest matching dial code.
    const match = [...AFRICAN_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
    if (match) return { iso: match.iso, num: digits.slice(match.dial.length) };
    return { iso: "CM", num: digits };
  }, [value]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const country = findAfricanCountry(parsed.iso);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AFRICAN_COUNTRIES;
    return AFRICAN_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q));
  }, [query]);

  const emit = (iso, num) => onChange(`+${findAfricanCountry(iso).dial} ${num}`.trim());

  return (
    <div className={`relative ${className}`}>
      <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-card transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <span className="text-xl leading-none">{country.flag}</span>
          <span className="text-slate-500">+{country.dial}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <div className="relative flex-1">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            inputMode="tel"
            value={parsed.num}
            onChange={(e) => emit(parsed.iso, e.target.value.replace(/[^\d ]/g, ""))}
            placeholder={placeholder}
            required={required}
            className="h-full w-full bg-transparent pl-9 pr-3 text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
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
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.map((c) => (
                <button
                  type="button"
                  key={c.iso}
                  onClick={() => { emit(c.iso, parsed.num); setOpen(false); setQuery(""); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-slate-700">{c.name}</span>
                  <span className="font-mono text-xs text-slate-400">+{c.dial}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}