import React, { useState } from "react";
import { Loader2, ShieldCheck, Copy, Download, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { enrollTotp, verifyTotp, generateRecoveryCodes } from "@/api/auth";

const btn = "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50";

/** Shows recovery codes once, with copy / download, and asks for confirmation. */
export function RecoveryCodes({ codes, onDone, doneLabel = "J'ai sauvegardé mes codes" }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const text = `Codes de secours Nelvin (usage unique)\n${new Date().toLocaleString("fr-FR")}\n\n${codes.join("\n")}\n`;

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
    a.download = "nelvin-codes-de-secours.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-3 text-sm">
      <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
        Conservez ces codes en lieu sûr. Chacun ne sert qu'une fois et permet de retrouver l'accès si vous perdez votre téléphone. Ils ne seront plus affichés.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-900">
        {codes.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className={`${btn} flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} Copier
        </button>
        <button type="button" onClick={download} className={`${btn} flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50`}>
          <Download className="h-4 w-4" /> Télécharger
        </button>
      </div>
      <label className="flex items-center gap-2 text-slate-600">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="accent-emerald-500" />
        J'ai mis ces codes en lieu sûr
      </label>
      <button type="button" onClick={onDone} disabled={!saved} className={`${btn} w-full bg-emerald-500 text-white hover:bg-emerald-600`}>{doneLabel}</button>
    </div>
  );
}

/**
 * Full TOTP enrollment: QR code → 6-digit confirmation → recovery codes.
 * `onDone` runs once the user has acknowledged their recovery codes.
 */
export default function MfaSetup({ onDone, onCancel }) {
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
      setError(e.message || "Code invalide");
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
          <p>Installez une application d'authentification (Google Authenticator, Microsoft Authenticator, 1Password…), puis continuez.</p>
          <div className="flex gap-2">
            <button type="button" onClick={start} disabled={busy} className={`${btn} flex-1 bg-slate-900 text-white hover:bg-slate-800`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Activer la 2FA
            </button>
            {onCancel && <button type="button" onClick={onCancel} className={`${btn} border border-slate-200 text-slate-600`}>Annuler</button>}
          </div>
        </div>
      )}

      {step === "scan" && enrolling && (
        <div className="space-y-3">
          <p>1. Scannez ce QR code avec votre application.</p>
          <img src={enrolling.qr_code} alt="QR code de double authentification" className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white p-2" />
          <p className="text-center text-xs text-slate-400">Impossible de scanner ? Saisissez la clé :</p>
          <p className="break-all text-center font-mono text-xs text-slate-500">{enrolling.secret}</p>
          <p>2. Saisissez le code à 6 chiffres affiché :</p>
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
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirmer
            </button>
            {onCancel && <button type="button" onClick={onCancel} className={`${btn} border border-slate-200 text-slate-600`}>Annuler</button>}
          </div>
        </div>
      )}

      {step === "codes" && <RecoveryCodes codes={codes} onDone={() => onDone?.()} />}
    </div>
  );
}
