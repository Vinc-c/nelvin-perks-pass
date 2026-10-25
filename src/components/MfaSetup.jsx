import React, { useState } from "react";
import { Loader2, ShieldCheck, Copy, Download, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useI18n } from "@/i18n/I18nContext";
import { enrollTotp, verifyTotp, generateRecoveryCodes } from "@/api/auth";

const btn = "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50";

/** Shows recovery codes once, with copy / download, and asks for confirmation. */
export function RecoveryCodes({ codes, onDone, doneLabel }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const text = `${t("ac.mfa.backupHeader")}\n${new Date().toLocaleString(locale)}\n\n${codes.join("\n")}\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the codes stay visible */ }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = t("ac.mfa.fileName");
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-3 text-sm">
      <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
        {t("ac.mfa.keepSafe")}
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900">
        {codes.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className={`${btn} flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {t("ac.common.copy")}
        </button>
        <button type="button" onClick={download} className={`${btn} flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50`}>
          <Download className="h-4 w-4" /> {t("ac.mfa.download")}
        </button>
      </div>
      <label className="flex items-center gap-2 text-slate-600">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="accent-emerald-500" />
        {t("ac.mfa.safeCheck")}
      </label>
      <button type="button" onClick={onDone} disabled={!saved} className={`${btn} w-full bg-emerald-500 text-white hover:bg-emerald-600`}>{doneLabel || t("ac.mfa.savedBtn")}</button>
    </div>
  );
}

/**
 * Full TOTP enrollment: QR code → 6-digit confirmation → recovery codes.
 * `onDone` runs once the user has acknowledged their recovery codes.
 */
export default function MfaSetup({ onDone, onCancel }) {
  const { t } = useI18n();
  const [step, setStep] = useState("intro");
  const [enrolling, setEnrolling] = useState(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      setEnrolling(await enrollTotp());
      setCode("");
      setStep("scan");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (value = code) => {
    setBusy(true);
    setError("");
    try {
      await verifyTotp(enrolling.id, value);
      // The session is now AAL2: issue the recovery codes right away.
      try {
        setCodes(await generateRecoveryCodes());
        setStep("codes");
      } catch {
        onDone?.();
      }
    } catch (e) {
      setError(e.message || t("ac.mfa.invalid"));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 text-sm text-slate-600">
      {error && <p className="rounded-lg bg-rose-50 p-3 text-rose-700">{error}</p>}

      {step === "intro" && (
        <div className="space-y-3">
          <p>{t("ac.mfa.intro")}</p>
          <div className="flex gap-2">
            <button type="button" onClick={start} disabled={busy} className={`${btn} flex-1 bg-slate-900 text-white hover:bg-slate-800`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {t("ac.sec.enable")}
            </button>
            {onCancel && <button type="button" onClick={onCancel} className={`${btn} border border-slate-200 text-slate-600`}>{t("ac.common.cancel")}</button>}
          </div>
        </div>
      )}

      {step === "scan" && enrolling && (
        <div className="space-y-3">
          <p>{t("ac.mfa.scan")}</p>
          <img src={enrolling.qr_code} alt={t("ac.mfa.qrAlt")} className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white p-2" />
          <p className="text-center text-xs text-slate-400">{t("ac.mfa.cantScan")}</p>
          <p className="break-all text-center font-mono text-xs text-slate-500">{enrolling.secret}</p>
          <p>{t("ac.mfa.enterCode")}</p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} onComplete={confirm} autoComplete="one-time-code" autoFocus>
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => confirm()} disabled={busy || code.length < 6} className={`${btn} flex-1 bg-emerald-500 text-white hover:bg-emerald-600`}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("ac.common.confirm")}
            </button>
            {onCancel && <button type="button" onClick={onCancel} className={`${btn} border border-slate-200 text-slate-600`}>{t("ac.common.cancel")}</button>}
          </div>
        </div>
      )}

      {step === "codes" && <RecoveryCodes codes={codes} onDone={() => onDone?.()} />}
    </div>
  );
}
