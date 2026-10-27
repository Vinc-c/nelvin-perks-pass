import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import MfaSetup, { RecoveryCodes } from "@/components/MfaSetup";
import {
  signInWithPassword, updatePassword, listTotpFactors, unenrollTotp, signOutOtherSessions, getMfaPolicy, generateRecoveryCodes,
} from "@/api/auth";
import { Shield, Lock, KeyRound, LogOut, Check, Loader2, Smartphone, ShieldCheck, ShieldOff, LifeBuoy } from "lucide-react";
import { isAdmin } from "@/lib/roles";

const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

function TwoFactor() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const [factors, setFactors] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [setup, setSetup] = useState(false);
  const [codes, setCodes] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    listTotpFactors().then(setFactors).catch(() => setFactors([]));
    getMfaPolicy().then(setPolicy).catch(() => setPolicy(null));
  };
  useEffect(() => { load(); }, []);

  const verified = (factors || []).find((f) => f.status === "verified");
  const mandatory = !!policy?.required;

  const disable = async () => {
    if (!window.confirm(t("ac.sec.confirmDisable"))) return;
    setBusy(true);
    try {
      await unenrollTotp(verified.id);
      toast({ title: t("ac.sec.disabledToast") });
      load();
    } catch (e) {
      toast({ title: t("ac.sec.disableFail"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (policy?.recovery_remaining && !window.confirm(t("ac.sec.confirmRegen"))) return;
    setBusy(true);
    try {
      setCodes(await generateRecoveryCodes());
    } catch (e) {
      toast({ title: t("ac.sec.actionFail"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard icon={Smartphone} title={t("ac.sec.twoFa")}>
      {factors === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : codes ? (
        <RecoveryCodes codes={codes} doneLabel={t("ac.sec.done")} onDone={() => { setCodes(null); load(); }} />
      ) : verified ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><ShieldCheck className="h-4 w-4" /> {t("ac.sec.enabledMsg")}</p>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-slate-900"><LifeBuoy className="h-4 w-4 text-slate-400" /> {t("ac.sec.recoveryTitle")}</p>
            <p className="mt-1 text-slate-500">
              {policy ? t(policy.recovery_remaining === 1 ? "ac.sec.codesOne" : "ac.sec.codesOther", { n: policy.recovery_remaining }) : ""} {t("ac.sec.codesHelp")}
            </p>
            {policy && policy.recovery_remaining <= 2 && <p className="mt-1 text-xs text-amber-700">{t("ac.sec.codesLow")}</p>}
            <button onClick={regenerate} disabled={busy} className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
              {policy?.recovery_remaining ? t("ac.sec.regen") : t("ac.sec.generate")}
            </button>
          </div>
          {mandatory ? (
            <p className="text-xs text-slate-500">{t("ac.sec.mandatoryNoDisable")}</p>
          ) : (
            <button onClick={disable} disabled={busy} className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"><ShieldOff className="h-4 w-4" /> {t("ac.sec.disableBtn")}</button>
          )}
        </div>
      ) : setup ? (
        <MfaSetup onDone={() => { setSetup(false); load(); toast({ title: t("ac.sec.enabledToast") }); }} onCancel={() => setSetup(false)} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{t("ac.sec.intro")}</p>
          {(mandatory || isAdmin(user)) && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t("ac.sec.mandatoryRole")}</p>}
          <button onClick={() => setSetup(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <ShieldCheck className="h-4 w-4" /> {t("ac.sec.enable")}
          </button>
        </div>
      )}
    </SectionCard>
  );
}

export default function SecuritySettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [sessionsBusy, setSessionsBusy] = useState(false);
  const google = user?.auth_provider === "google";

  // Re-checks the current password, then sets the new one.
  const savePwd = async () => {
    setPwdError("");
    if (!pwd.current || !pwd.next) return setPwdError(t("ac.sec.fillAll"));
    if (pwd.next.length < 8) return setPwdError(t("ac.sec.newPwShort"));
    if (pwd.next !== pwd.confirm) return setPwdError(t("auth.err.mismatch"));
    setPwdBusy(true);
    try {
      await signInWithPassword(user?.email || "", pwd.current);
      await updatePassword(pwd.next);
      setPwdSaved(true);
      setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 2500);
    } catch (e) {
      setPwdError(/invalid/i.test(e.message || "") ? t("ac.sec.pwWrong") : e.message || t("ac.sec.updateFail"));
    } finally {
      setPwdBusy(false);
    }
  };

  const logoutOthers = async () => {
    setSessionsBusy(true);
    try {
      await signOutOtherSessions();
      toast({ title: t("ac.sec.othersClosed"), description: t("ac.sec.othersClosedDesc") });
    } catch (e) {
      toast({ title: t("ac.common.error"), description: e.message, variant: "destructive" });
    } finally {
      setSessionsBusy(false);
    }
  };

  return (
    <PortalLayout title={t("ac.sec.title")} theme="light">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Shield className="h-5 w-5 text-emerald-600" /> {t("ac.sec.pageHeading")}</h1>
        <p className="text-sm text-slate-500">{t("ac.sec.pageSub")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Lock} title={t("auth.password")}>
          {google ? (
            <p className="text-sm text-slate-500">{t("ac.sec.googleNote")}</p>
          ) : (
            <div className="space-y-3">
              <input type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder={t("ac.sec.currentPw")} aria-label={t("ac.sec.currentPw")} className={input} />
              <input type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder={t("ac.sec.newPwPh")} aria-label={t("ac.sec.newPw")} className={input} />
              <input type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder={t("ac.sec.confirmPwPh")} aria-label={t("ac.sec.confirmPwPh")} className={input} />
              <button onClick={savePwd} disabled={pwdBusy} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {pwdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} {t("ac.sec.update")}
              </button>
              {pwdError && <p className="text-sm text-rose-600">{pwdError}</p>}
              {pwdSaved && <p className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> {t("ac.sec.pwUpdated")}</p>}
            </div>
          )}
        </SectionCard>

        <TwoFactor />

        <SectionCard icon={LogOut} title={t("ac.sec.devices")}>
          <p className="text-sm text-slate-500">{t("ac.sec.devicesText")}</p>
          <button onClick={logoutOthers} disabled={sessionsBusy} className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {sessionsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} {t("ac.sec.logoutOthers")}
          </button>
        </SectionCard>
      </div>
    </PortalLayout>
  );
}
