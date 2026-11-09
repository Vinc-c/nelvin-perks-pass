import React from "react";
import { Link } from "react-router-dom";
import NelvinLogo from "@/components/NelvinLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

/** Minimal header (logo, language, back to my space) for pages outside the portal layout. */
export default function TopBar() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-lg sm:px-6">
      <Link to="/" className="flex items-center"><NelvinLogo className="h-8" /></Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher compact variant="light" />
        {isAuthenticated && <Link to="/app" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">{t("nav.mySpace")}</Link>}
      </div>
    </header>
  );
}
