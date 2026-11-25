import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import PhoneInput from "@/components/PhoneInput";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/api/auth";
import { useI18n } from "@/i18n/I18nContext";

/** Sign in or sign up with a phone number: enter number, receive an SMS code, enter it. */
export default function PhoneLogin({ redirectTo = "/app", onError }) {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const send = async (e) => {
    e?.preventDefault();
    if (busy || cooldown > 0) return;
    if (phone.replace(/\D/g, "").length < 8) { onError?.(t("auth.err.phone")); return; }
    onError?.(""); setBusy(true);
    try { await sendPhoneOtp(phone); setStep(1); setCode(""); setCooldown(45); }
    catch (err) { onError?.(err.message); }
    finally { setBusy(false); }
  };
  const verify = async (value = code) => {
    if (busy || value.length < 6) return;
    onError?.(""); setBusy(true);
    try { await verifyPhoneOtp(phone, value); window.location.href = redirectTo; }
    catch (err) { onError?.(err.message); setBusy(false); }
  };

  if (step === 0) {
    return (
      <form onSubmit={send} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-phone">{t("reg.phone")}</Label>
          <PhoneInput value={phone} onChange={setPhone} required />
          <p className="text-xs text-muted-foreground">{t("auth.phone.hint")}</p>
        </div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{t("auth.phone.send")}<ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
        </Button>
      </form>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("auth.phone.sentTo", { phone })}</p>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); if (v.length === 6) verify(v); }} autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*">
          <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="button" className="h-12 w-full" disabled={busy || code.length < 6} onClick={() => verify()}>
        {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{t("auth.phone.verify")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={send} disabled={cooldown > 0 || busy} className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-nv-muted disabled:no-underline">
          {cooldown > 0 ? t("auth.resendIn", { s: cooldown }) : t("auth.resend")}
        </button>
      </p>
      <button type="button" onClick={() => { setStep(0); setCode(""); onError?.(""); }} className="nv-focus mx-auto flex items-center gap-1.5 text-xs font-medium text-nv-muted hover:text-nv-ink">
        <ArrowLeft className="h-3 w-3 rtl:rotate-180" />{t("auth.phone.change")}
      </button>
    </div>
  );
}
