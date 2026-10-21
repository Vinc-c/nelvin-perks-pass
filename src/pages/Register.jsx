import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signUp, verifySignupOtp, resendSignupOtp, signInWithGoogle, updateMe } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AccountTypePicker, { ACCOUNT_TYPES } from "@/components/AccountTypePicker";
import PhoneInput from "@/components/PhoneInput";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
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
    } catch (err) {
      setError(err.message || t("auth.err.signup"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify the email OTP, sign in, then go to onboarding.
  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      await verifySignupOtp(email, otpCode);
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
    setError("");
    try { await resendSignupOtp(email); } catch (err) { setError(err.message || t("auth.err.resend")); }
  };

  const handleGoogle = async () => {
    const returnTo = safeReturnTo();
    try {
      await signInWithGoogle(returnTo !== "/" ? returnTo : onboardingDest(accountType));
    } catch (err) {
      setError(err.message || t("auth.err.google"));
    }
  };

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

            <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
              <GoogleIcon className="w-5 h-5 mr-2" />
              {t("auth.google")}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">{t("reg.or")}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("reg.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="email" type="email" autoComplete="email" autoFocus placeholder={t("auth.placeholderEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("reg.phone")}</Label>
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("reg.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("reg.confirm")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("auth.creating")}</> : <>{t("auth.createBtn")} <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <h2 className="text-xl font-bold tracking-tight text-nv-ink">{t("auth.verifyTitle")}</h2>
            <p className="mt-1 text-sm text-nv-muted">{t("auth.verifySent", { email })}</p>
            {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
            <div className="mt-6 flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="mt-6 h-12 w-full font-medium" onClick={verify} disabled={loading || otpCode.length < 6}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("auth.verifying")}</> : <>{t("auth.verifyBtn")} <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-4 text-center text-sm text-nv-muted">
              {t("auth.noCode")}{" "}
              <button onClick={resend} className="font-medium text-primary hover:underline">{t("auth.resend")}</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}