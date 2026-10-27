import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import WorldCountrySelect from "@/components/WorldCountrySelect";
import { useI18n } from "@/i18n/I18nContext";

export default function CompanyFields({ value, onChange }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">{t("mb.cf.name")}</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="company_name"
            placeholder={t("mb.cf.namePh")}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="h-12 bg-card pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_country">{t("mb.cf.country")}</Label>
        <WorldCountrySelect value={value.country} onChange={(v) => onChange({ ...value, country: v })} placeholder={t("mb.cf.countryPh")} />
      </div>
      <p className="text-xs text-muted-foreground">{t("mb.cf.trial")}</p>
    </div>
  );
}