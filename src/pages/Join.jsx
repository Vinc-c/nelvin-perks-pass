import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, KeyRound, Loader2, Building2, Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import NelvinLogo, { NelvinMark } from "@/components/NelvinLogo";

const STEPS = ["Invite", "Account", "Verify"];

const benefits = [
  { icon: Sparkles, text: "30-day free trial on every plan" },
  { icon: Building2, text: "1,900+ Buy 1 Get 1 Free brands across Africa & MENA" },
  { icon: ShieldCheck, text: "Secure, invite-only onboarding — your data stays in your company" },
];

export default function Join() {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [invite, setInvite] = useState(null);

  // Step 1 — validate invite code + work email
  const validateCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("ValidateInviteCode", { code, email });
      const data = res.data || res;
      if (!data || data.valid === false) {
        setError(data?.error || "Invalid invite code");
        setLoading(false);
        return;
      }
      setInvite({ code_id: data.code_id, company_id: data.company_id, role: data.role });
      setStep(1);
    } catch (err) {
      setError(err.message || "Failed to validate code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — create the account (unverified)
  const createAccount = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setStep(2);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — verify OTP, link tenant, redirect
  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      try {
        await base44.functions.invoke("ConsumeInviteCode", { code_id: invite.code_id });
      } catch (linkErr) {
        console.warn("Tenant linking failed:", linkErr);
      }
      window.location.href = "/app";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try { await base44.auth.resendOtp(email); } catch (err) { setError(err.message || "Failed to resend code"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Brand / benefits panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2 text-white">
          <NelvinMark className="h-10 w-10" />
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">Join your company in 3 simple steps.</h2>
          <p className="mt-3 max-w-md text-blue-100">Activate your employee benefits, wallet and perks in minutes — with a 30-day free trial on every plan.</p>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.text} className="flex items-center gap-3 text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Icon className="h-5 w-5" /></span>
                  <span className="text-sm text-blue-50">{b.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs text-blue-200">© 2026 Nelvin Benefits — Built for Africa & MENA</p>
      </div>

      {/* Wizard */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 lg:py-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
             <NelvinLogo className="h-8" />
          </div>

          {/* Stepper */}
          <div className="mb-8 flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${i <= step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`ml-2 text-xs font-medium ${i === step ? "text-slate-900" : "text-slate-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded ${i < step ? "bg-blue-600" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
            <AnimatePresence mode="wait">
              {/* Step 1 — invite code */}
              {step === 0 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join your company</h1>
                  <p className="mt-1 text-sm text-slate-500">Enter the invite code from your HR team and your work email.</p>
                  {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
                  <form onSubmit={validateCode} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">HR invite code</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="code" autoFocus placeholder="e.g. NEL-7K2P9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-12 pl-10 font-mono uppercase tracking-wider" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating…</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 2 — account */}
              {step === 1 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
                  <p className="mt-1 text-sm text-slate-500">Secure your access with a password.</p>
                  {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
                  <form onSubmit={createAccount} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Create password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="h-12 px-4" onClick={() => { setStep(0); setError(""); }}><ArrowLeft className="h-4 w-4" /></Button>
                      <Button type="submit" className="h-12 flex-1 font-medium" disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 3 — verify */}
              {step === 2 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
                  <p className="mt-1 text-sm text-slate-500">We sent a 6-digit code to {email}</p>
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
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : <>Verify & join <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="mt-4 text-center text-sm text-slate-500">
                    Didn't receive the code?{" "}
                    <button onClick={resend} className="font-medium text-blue-600 hover:underline">Resend</button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 30-day trial note */}
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Sparkles className="h-4 w-4" /> Every plan includes a 30-day free trial — no charge until it ends.
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}