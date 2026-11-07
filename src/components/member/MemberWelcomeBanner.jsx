import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export const displayName = (user) => {
  const raw = user?.full_name || (user?.email ? user.email.split("@")[0] : "");
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
};

/** Plain greeting on the page background: small grey line, then the member's name. */
export default function MemberWelcomeBanner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const h = new Date().getHours();
  const greet = h < 12 ? "rd.greet.morning" : h < 18 ? "rd.greet.afternoon" : "rd.greet.evening";
  return (
    <div className="mb-4">
      <p className="text-sm text-slate-500">{t(greet)}</p>
      <h1 className="truncate text-[28px] font-medium leading-tight text-slate-900">{displayName(user)}</h1>
    </div>
  );
}
