import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

export const displayName = (user) => {
  const raw = user?.full_name || (user?.email ? user.email.split("@")[0] : "");
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
};
export const initialsOf = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "")).toUpperCase();
};

/** Member dashboard banner: avatar, greeting, name, member chip, bell. */
export default function MemberWelcomeBanner({ shortCode }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const name = displayName(user);
  const h = new Date().getHours();
  const greet = h < 12 ? "rd.greet.morning" : h < 18 ? "rd.greet.afternoon" : "rd.greet.evening";
  return (
    <div className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-[20px] bg-nv-emerald px-4 pb-5 pt-4 text-white">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nv-deep text-sm font-medium text-white ring-2 ring-nv-gold" aria-hidden="true">{initialsOf(name)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/70">{t(greet)}</p>
        <h1 className="truncate text-xl font-medium">{name}</h1>
        <span className="mt-1 inline-block rounded-full border border-nv-gold px-2 py-0.5 text-[11px] text-nv-gold-light">
          {t("rd.member")}{shortCode ? ` · ${shortCode}` : ""}
        </span>
      </div>
      <Link to="/notifications" aria-label={t("rd.notifications")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
        <Bell className="h-5 w-5" strokeWidth={1.5} />
      </Link>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-nv-gold" />
    </div>
  );
}
