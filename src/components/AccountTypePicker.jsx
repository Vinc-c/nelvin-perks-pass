import React from "react";
import { User as UserIcon, Store, Building2 } from "lucide-react";

export const ACCOUNT_TYPES = [
  { v: "particulier", l: "Particulier", s: "Profiter des offres", icon: UserIcon },
  { v: "marchand", l: "Marchand", s: "Publier mes offres", icon: Store },
  { v: "entreprise", l: "Entreprise / RH", s: "Gérer mes employés", icon: Building2 },
];

export default function AccountTypePicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ACCOUNT_TYPES.map((o) => {
        const Icon = o.icon;
        const active = value === o.v;
        return (
          <button
            type="button"
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`not-pill flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition ${
              active ? "border-primary bg-primary/5" : "border-border hover:border-slate-300"
            }`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold leading-tight">{o.l}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{o.s}</span>
          </button>
        );
      })}
    </div>
  );
}