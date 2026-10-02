import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Loader2, Lock, CreditCard, Home } from "lucide-react";

// Blocks portal content when the user's subscription/company plan has ended.
// Renders children when access is allowed; otherwise shows a contextual
// "reactivate" screen. Keeps billing/membership pages reachable so the user
// can renew.
export default function AccessGate({ children }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, allowed: true, reason: "" });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("CheckAccess", {});
        if (!alive) return;
        const d = res.data || {};
        setState({ loading: false, allowed: !!d.allowed, reason: d.reason || "" });
      } catch {
        if (alive) setState({ loading: false, allowed: true, reason: "" });
      }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  if (state.loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (state.allowed) return <>{children}</>;

  const role = user?.role;
  const isHr = role === "HR_ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const isMember = role === "MEMBER" || role === "user";

  const title = isHr || isEmployee ? t("access.expired.company") : t("access.expired.generic");
  const desc = isHr ? t("access.desc.hr") : isEmployee ? t("access.desc.employee") : t("access.desc.member");

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <Lock className="h-7 w-7 text-rose-500" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{desc}</p>
        <div className="mt-6">
          {isHr ? (
            <Link to="/billing-settings" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
              <CreditCard className="h-4 w-4" /> {t("access.reactivate.sub")}
            </Link>
          ) : isMember ? (
            <Link to="/membership-plans" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
              <CreditCard className="h-4 w-4" /> {t("access.reactivate.membership")}
            </Link>
          ) : (
            <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              <Home className="h-4 w-4" /> {t("access.backHome")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}