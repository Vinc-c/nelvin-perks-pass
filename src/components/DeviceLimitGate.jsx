import React from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import DevicesPanel from "@/components/DevicesPanel";

/** Shown instead of the app when a 5th device tries to sign in to the same account. */
export default function DeviceLimitGate() {
  const { t } = useI18n();
  const { deviceBlock, recheckDevice, logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600"><ShieldAlert className="h-6 w-6" /></span>
          <h1 className="text-lg font-bold text-slate-900">{t("dev.title")}</h1>
        </div>
        <p className="mt-3 text-sm text-slate-600">{t("dev.desc", { n: deviceBlock?.limit || 4 })}</p>
        <div className="mt-4"><DevicesPanel devices={deviceBlock?.devices || []} onChanged={recheckDevice} /></div>
        <div className="mt-5 flex gap-2">
          <button onClick={recheckDevice} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">{t("dev.retry")}</button>
          <button onClick={() => logout()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{t("dev.signOut")}</button>
        </div>
      </div>
    </div>
  );
}
