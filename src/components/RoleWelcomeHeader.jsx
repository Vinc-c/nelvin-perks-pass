import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { currentPortal } from "@/lib/portalNav";
import { Wallet, Gift, Users, Store, ShieldCheck } from "lucide-react";

const PROFILES = {
  MEMBER: { gradient: "from-emerald-500 to-emerald-700", icon: Wallet, labelKey: "welcome.member.label", taglineKey: "welcome.member.tagline" },
  user: { gradient: "from-emerald-500 to-emerald-700", icon: Wallet, labelKey: "welcome.member.label", taglineKey: "welcome.member.tagline" },
  EMPLOYEE: { gradient: "from-blue-500 to-blue-700", icon: Gift, labelKey: "welcome.employee.label", taglineKey: "welcome.employee.tagline" },
  HR_ADMIN: { gradient: "from-amber-500 to-amber-700", icon: Users, labelKey: "welcome.hr.label", taglineKey: "welcome.hr.tagline" },
  MERCHANT: { gradient: "from-teal-500 to-emerald-700", icon: Store, labelKey: "welcome.merchant.label", taglineKey: "welcome.merchant.tagline" },
  SUPER_ADMIN: { gradient: "from-brand to-brand/70", icon: ShieldCheck, labelKey: "welcome.admin.label", taglineKey: "welcome.admin.tagline" },
  admin: { gradient: "from-brand to-brand/70", icon: ShieldCheck, labelKey: "welcome.admin.label", taglineKey: "welcome.admin.tagline" },
};

export default function RoleWelcomeHeader() {
  const { user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const portal = currentPortal(user, location.pathname, location.search);
  const p = PROFILES[portal === "ADMIN" ? "admin" : portal] || PROFILES.MEMBER;
  const Icon = p.icon;
  const name = user?.full_name || (user?.email ? user.email.split("@")[0] : t("welcome.greeting"));
  return (
    <div className={`mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-br ${p.gradient} p-5 text-white shadow-lg`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/80">{t(p.labelKey)}</p>
        <h1 className="truncate text-lg font-bold sm:text-xl">{t("welcome.greeting")}, {name}</h1>
        <p className="truncate text-xs text-white/80 sm:text-sm">{t(p.taglineKey)}</p>
      </div>
    </div>
  );
}