import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signUp, verifySignupOtp, resendSignupOtp } from "@/api/auth";
import { invokeFunction } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, KeyRound, Loader2, Building2, Check, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import NelvinLogo, { NelvinMark } from "@/components/NelvinLogo";

const STEPS = ["Invitation", "Compte", "Vérification"];

const benefits = [
  { icon: Sparkles, text: "Essai gratuit offert par votre entreprise" },
  { icon: Building2, text: "Offres chez les commerces partenaires des villes africaines" },
  { icon: ShieldCheck, text: "Accès sur invitation : vos données restent dans votre entreprise" },
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
  const [verified, setVerified] = useState(false);

  // Step 1 — validate invite code + work email
  const validateCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await invokeFunction("validate-invite-code", { code, email });
      const data = res.data || res;
      if (!data || data.valid === false) {
        setError(data?.error || "Code d'invitation invalide.");
        setLoading(false);
        return;
      }
      setInvite({ code_id: data.code_id, company_id: data.company_id, role: data.role });
      setStep(1);
    } catch (err) {
      setError(err.message || "Impossible de valider le code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — create the account (unverified)
  const createAccount = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setLoading(true);
    try {
      const { needsVerification } = await signUp({ email, password });
      if (!needsVerification) {
        setVerified(true);
        await linkAndContinue();
        return;
      }
      setStep(2);
    } catch (err) {
      setError(err.message || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — verify OTP, link tenant, redirect
  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      if (!verified) {
        await verifySignupOtp(email, otpCode);
        setVerified(true);
      }
      await linkAndContinue();
    } catch (err) {
      setError(err.message || "Code de vérification invalide.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    try { await resendSignupOtp(email); } catch (err) { setError(err.message || "Impossible de renvoyer le code."); }
  };

  // Links the new account to the company. A failure here must be visible:
  // otherwise the employee lands in a member account with no company.
  async function linkAndContinue() {
    try {
      await invokeFunction("consume-invite-code", { code_id: invite.code_id });
    } catch (linkErr) {
      setError(linkErr.message || "Impossible de lier votre compte à l'entreprise. Contactez votre RH.");
      setStep(2);
      return;
    }
    window.location.href = "/app";
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Brand / benefits panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2 text-white">
          <NelvinMark className="h-10 w-10" />
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">Rejoignez votre entreprise en 3 étapes.</h2>
          <p className="mt-3 max-w-md text-blue-100">Activez vos avantages salariés, votre wallet et vos offres en quelques minutes.</p>
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
        <p className="text-xs text-blue-200">© 2026 Nelvin Benefits, pensé pour l'Afrique</p>
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
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rejoindre votre entreprise</h1>
                  <p className="mt-1 text-sm text-slate-500">Saisissez le code d'invitation de votre équipe RH et votre email professionnel.</p>
                  {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
                  <form onSubmit={validateCode} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code d'invitation RH</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="code" autoFocus placeholder="ex. NEL-7K2P9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-12 pl-10 font-mono uppercase tracking-wider" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="email" type="email" placeholder="vous@entreprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validation…</> : <>Continuer <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 2 — account */}
              {step === 1 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Créez votre compte</h1>
                  <p className="mt-1 text-sm text-slate-500">Sécurisez votre accès avec un mot de passe (8 caractères min.).</p>
                  {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
                  <form onSubmit={createAccount} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="h-12 px-4" onClick={() => { setStep(0); setError(""); }}><ArrowLeft className="h-4 w-4" /></Button>
                      <Button type="submit" className="h-12 flex-1 font-medium" disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…</> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 3 — verify */}
              {step === 2 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vérifiez votre email</h1>
                  <p className="mt-1 text-sm text-slate-500">Nous avons envoyé un code à 6 chiffres à {email}</p>
                  {error && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
                  <div className="mt-6 flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button className="mt-6 h-12 w-full font-medium" onClick={verify} disabled={loading || (!verified && otpCode.length < 6)}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…</> : <>Vérifier et rejoindre <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="mt-4 text-center text-sm text-slate-500">
                    Code non reçu ?{" "}
                    <button onClick={resend} className="font-medium text-blue-600 hover:underline">Renvoyer</button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 30-day trial note */}
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Sparkles className="h-4 w-4" /> Votre accès est couvert par l'abonnement de votre entreprise : aucun paiement ne vous est demandé.
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}