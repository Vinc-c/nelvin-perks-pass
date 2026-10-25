import React, { useState } from "react";
import { ShieldCheck, Loader2, LifeBuoy } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { listTotpFactors, verifyTotp, redeemRecoveryCode } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

/** Second step of sign-in for accounts with two-factor authentication. */
export default function MfaChallenge() {
  const { t } = useI18n();
  const { checkUserAuth, logout } = useAuth();
  const [mode, setMode] = useState("totp");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (value = code) => {
    setError("");
    setLoading(true);
    try {
      const factors = (await listTotpFactors()).filter((f) => f.status === "verified");
      if (!factors.length) throw new Error(t("ac.mfa.noFactor"));
      let lastError = null;
      for (const f of factors) {
        try {
          await verifyTotp(f.id, value);
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (lastError) throw lastError;
      await checkUserAuth({ silent: true });
    } catch (e) {
      setError(e.message || t("ac.mfa.invalid"));
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const recover = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await redeemRecoveryCode(recovery);
      setInfo(t("ac.mfa.recoveryAccepted"));
      await checkUserAuth({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={mode === "totp" ? ShieldCheck : LifeBuoy}
      title={mode === "totp" ? t("ac.mfa.title") : t("ac.mfa.recTitle")}
      subtitle={mode === "totp" ? t("ac.mfa.subTotp") : t("ac.mfa.subRec")}
    >
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{info}</div>}

      {mode === "totp" ? (
        <>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code" onComplete={submit}>
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="mt-6 h-12 w-full" onClick={() => submit()} disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t("ac.mfa.verify")}
          </Button>
          <button onClick={() => { setMode("recovery"); setError(""); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">
            {t("ac.mfa.lostPhone")}
          </button>
        </>
      ) : (
        <form onSubmit={recover}>
          <input
            value={recovery}
            onChange={(e) => setRecovery(e.target.value.toUpperCase())}
            placeholder="ABCDE-FGH23"
            autoFocus
            autoComplete="off"
            aria-label={t("ac.mfa.recTitle")}
            className="h-12 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-lg tracking-widest"
          />
          <Button type="submit" className="mt-4 h-12 w-full" disabled={loading || recovery.replace(/[^A-Z0-9]/g, "").length !== 10}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t("ac.mfa.useCode")}
          </Button>
          <button type="button" onClick={() => { setMode("totp"); setError(""); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">
            {t("ac.mfa.backToApp")}
          </button>
        </form>
      )}
      <button onClick={() => logout(true)} className="mt-2 w-full text-center text-sm text-muted-foreground hover:underline">{t("ui.signOut")}</button>
    </AuthLayout>
  );
}
