import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  signInWithPassword, updatePassword, listTotpFactors, enrollTotp, verifyTotp, unenrollTotp, signOutOtherSessions,
} from "@/api/auth";
import { Shield, Lock, KeyRound, LogOut, Check, Loader2, Smartphone, ShieldCheck, ShieldOff } from "lucide-react";
import { isAdmin } from "@/lib/roles";

const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

function TwoFactor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [factors, setFactors] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => listTotpFactors().then(setFactors).catch(() => setFactors([]));
  useEffect(() => { load(); }, []);

  const verified = (factors || []).find((f) => f.status === "verified");

  const start = async () => {
    setBusy(true);
    try {
      setEnrolling(await enrollTotp());
      setCode("");
    } catch (e) {
      toast({ title: "Activation impossible", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    setBusy(true);
    try {
      await verifyTotp(enrolling.id, code);
      setEnrolling(null);
      toast({ title: "Double authentification activée", description: "Un code vous sera demandé à chaque connexion." });
      load();
    } catch (e) {
      toast({ title: "Code invalide", description: e.message, variant: "destructive" });
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!window.confirm("Désactiver la double authentification ?")) return;
    setBusy(true);
    try {
      await unenrollTotp(verified.id);
      toast({ title: "Double authentification désactivée" });
      load();
    } catch (e) {
      toast({ title: "Désactivation impossible", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard icon={Smartphone} title="Double authentification (2FA)">
      {factors === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : verified ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><ShieldCheck className="h-4 w-4" /> Activée — un code est demandé à chaque connexion.</p>
          <button onClick={disable} disabled={busy} className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"><ShieldOff className="h-4 w-4" /> Désactiver</button>
        </div>
      ) : enrolling ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p>1. Scannez ce QR code avec Google Authenticator, Microsoft Authenticator ou 1Password.</p>
          <img src={enrolling.qr_code} alt="QR code de double authentification" className="mx-auto h-44 w-44 rounded-lg border border-slate-200 bg-white p-2" />
          <p className="break-all text-center font-mono text-xs text-slate-400">{enrolling.secret}</p>
          <p>2. Saisissez le code à 6 chiffres affiché :</p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <button onClick={confirmCode} disabled={busy || code.length < 6} className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">Confirmer</button>
            <button onClick={() => setEnrolling(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Protégez votre compte avec un code temporaire généré sur votre téléphone.</p>
          {isAdmin(user) && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Fortement recommandé pour les super admins : une fois activée, les actions d'administration exigent une session validée par 2FA.</p>}
          <button onClick={start} disabled={busy} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Activer la 2FA
          </button>
        </div>
      )}
    </SectionCard>
  );
}

export default function SecuritySettings() {
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
    if (!pwd.current || !pwd.next) return setPwdError("Renseignez tous les champs.");
    if (pwd.next.length < 8) return setPwdError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (pwd.next !== pwd.confirm) return setPwdError("Les mots de passe ne correspondent pas.");
    setPwdBusy(true);
    try {
      await signInWithPassword(user?.email || "", pwd.current);
      await updatePassword(pwd.next);
      setPwdSaved(true);
      setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 2500);
    } catch (e) {
      setPwdError(/invalid/i.test(e.message || "") ? "Mot de passe actuel incorrect." : e.message || "Échec de la mise à jour.");
    } finally {
      setPwdBusy(false);
    }
  };

  const logoutOthers = async () => {
    setSessionsBusy(true);
    try {
      await signOutOtherSessions();
      toast({ title: "Autres sessions fermées", description: "Tous vos autres appareils ont été déconnectés." });
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSessionsBusy(false);
    }
  };

  return (
    <PortalLayout title="Sécurité" theme="light">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Shield className="h-5 w-5 text-emerald-600" /> Sécurité du compte</h1>
        <p className="text-sm text-slate-500">Mot de passe, double authentification et appareils connectés.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Lock} title="Mot de passe">
          {google ? (
            <p className="text-sm text-slate-500">Vous vous connectez avec Google : votre mot de passe est géré par Google.</p>
          ) : (
            <div className="space-y-3">
              <input type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="Mot de passe actuel" aria-label="Mot de passe actuel" className={input} />
              <input type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="Nouveau mot de passe (8 caractères min.)" aria-label="Nouveau mot de passe" className={input} />
              <input type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Confirmer le nouveau mot de passe" aria-label="Confirmer le mot de passe" className={input} />
              <button onClick={savePwd} disabled={pwdBusy} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                {pwdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Mettre à jour
              </button>
              {pwdError && <p className="text-sm text-rose-600">{pwdError}</p>}
              {pwdSaved && <p className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Mot de passe mis à jour.</p>}
            </div>
          )}
        </SectionCard>

        <TwoFactor />

        <SectionCard icon={LogOut} title="Appareils connectés">
          <p className="text-sm text-slate-500">Vous avez perdu un téléphone ou utilisé un ordinateur partagé ? Déconnectez toutes les autres sessions. Cet appareil reste connecté.</p>
          <button onClick={logoutOthers} disabled={sessionsBusy} className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {sessionsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Déconnecter les autres appareils
          </button>
        </SectionCard>
      </div>
    </PortalLayout>
  );
}
