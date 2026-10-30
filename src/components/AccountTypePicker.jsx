import React from "react";
import { User as UserIcon, Store, Building2 } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

export const ACCOUNT_TYPES = [
  { v: "particulier", l: "Individual", s: "Enjoy the offers", lk: "reg.individual", sk: "reg.individualSub", icon: UserIcon },
  { v: "marchand", l: "Merchant", s: "Publish your offers", lk: "reg.merchant", sk: "reg.merchantSub", icon: Store },
  { v: "entreprise", l: "Company / HR", s: "Manage your employees", lk: "reg.company", sk: "reg.companySub", icon: Building2 },
];

export default function AccountTypePicker({ value, onChange }) {
  const { t } = useI18n();
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
            <span className="text-xs font-semibold leading-tight">{t(o.lk)}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{t(o.sk)}</span>
          </button>
        );
      })}
    </div>
  );
}