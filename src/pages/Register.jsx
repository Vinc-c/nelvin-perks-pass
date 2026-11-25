import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signUp, verifySignupOtp, resendSignupOtp, updateMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Loader2, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import PasswordField from "@/components/auth/PasswordField";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AccountTypePicker, { ACCOUNT_TYPES } from "@/components/AccountTypePicker";
import PhoneInput from "@/components/PhoneInput";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/i18n/I18nContext";

const onboardingDest = (type) => "/onboarding?type=" + type;

export default function Register() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // /register?type=marchand (from the partner page) pre-selects the account type.
  const [accountType, setAccountType] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    return ACCOUNT_TYPES.some((a) => a.v === t) ? t : "particulier";
  });
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  // Referral code from a shared link (/register?ref=NEL…), kept for Google sign-up too.
  const [referralCode] = useState(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      try { localStorage.setItem("nelvin_ref", ref.toUpperCase()); } catch { /* storage unavailable */ }
    }
    return (ref || "").toUpperCase();
  });

  // Step 1 — create the (unverified) account, then advance to OTP.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.err.mismatch"));
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 6) {
      setError(t("auth.err.phone"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.err.pwShort"));
      return;
    }
    setLoading(true);
    try {
      const { needsVerification } = await signUp({ email, password, metadata: { phone, ...(referralCode ? { referral_code: referralCode } : {}) } });
      if (!needsVerification) {
        // Email confirmation disabled on the project: already signed in.
        try { await updateMe({ phone }); } catch { /* optional */ }
        window.location.href = safeReturnTo() !== "/" ? safeReturnTo() : onboardingDest(accountType);
        return;
      }
      setStep(1);
      setCooldown(45);
    } catch (err) {
      setError(err.message || t("auth.err.signup"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify the email OTP, sign in, then go to onboarding.
  const verify = async (code = otpCode) => {
    if (loading || code.length < 6) return;
    setError("");
    setLoading(true);
    try {
      await verifySignupOtp(email, code);
      try { await updateMe({ phone }); } catch { /* optional */ }
      const dest = onboardingDest(accountType);
      window.location.href = safeReturnTo() !== "/" ? safeReturnTo() : dest;
    } catch (err) {
      setError(err.message || t("auth.err.code"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(""); setNotice("");
    try { await resendSignupOtp(email); setNotice(t("auth.codeSent", { email })); setCooldown(45); setOtpCode(""); }
    catch (err) { setError(err.message || t("auth.err.resend")); }
  };
  const changeEmail = () => { setStep(0); setOtpCode(""); setError(""); setNotice(""); };


  return (
    <AuthLayout
      icon={UserPlus}
      title={t("auth.reg.title")}
      subtitle={t("auth.reg.subtitle")}
      footer={
        <>
          {t("auth.hasAccount")}{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">{t("reg.chooseType")}</p>
              <AccountTypePicker value={accountType} onChange={setAccountType} />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t("reg.invited")}{" "}
                <Link to="/join" className="font-medium text-primary hover:underline">{t("reg.inviteLink")}</Link>
              </p>
            </div>

            <SocialAuthButtons redirectPath={safeReturnTo() !== "/" ? safeReturnTo() : onboardingDest(accountType)} onError={setError} />

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">{t("reg.or")}</span>
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("reg.email")}</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" type="email" autoComplete="email" autoFocus placeholder={t("auth.placeholderEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10 h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("reg.phone")}</Label>
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("reg.password")}</Label>
                <PasswordField id="password" value={password} onChange={setPassword} autoComplete="new-password" showStrength />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("reg.confirm")}</Label>
                <PasswordField id="confirm" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" invalid={!!confirmPassword && confirmPassword !== password} />
                {confirmPassword && (
                  <p className={`flex items-center gap-1 text-xs ${confirmPassword === password ? "text-[#15803d]" : "text-rose-600"}`} aria-live="polite">
                    {confirmPassword === password ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {confirmPassword === password ? t("auth.match") : t("auth.nomatch")}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t("auth.creating")}</> : <>{t("auth.createBtn")} <ArrowRight className="ms-2 h-4 w-4" /></>}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <h2 className="text-xl font-bold tracking-tight text-nv-ink">{t("auth.verifyTitle")}</h2>
            <p className="mt-1 text-sm text-nv-muted">{t("auth.verifySent", { email })}</p>
            {error && <div role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
            <div className="mt-6 flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={(v) => { setOtpCode(v); if (v.length === 6) verify(v); }} autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*">
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="mt-6 h-12 w-full font-medium" onClick={() => verify()} disabled={loading || otpCode.length < 6}>
              {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t("auth.verifying")}</> : <>{t("auth.verifyBtn")} <ArrowRight className="ms-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-4 text-center text-sm text-nv-muted">
              {t("auth.noCode")}{" "}
              <button type="button" onClick={resend} disabled={cooldown > 0} className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-nv-muted disabled:no-underline">{cooldown > 0 ? t("auth.resendIn", { s: cooldown }) : t("auth.resend")}</button>
            </p>
            {notice && <p role="status" className="mt-2 text-center text-xs text-[#15803d]">{notice}</p>}
            <button type="button" onClick={changeEmail} className="nv-focus mx-auto mt-3 flex items-center gap-1.5 text-xs font-medium text-nv-muted hover:text-nv-ink"><ArrowLeft className="h-3 w-3 rtl:rotate-180" />{t("auth.changeEmail")}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}