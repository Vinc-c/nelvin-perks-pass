import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import MfaSetup, { RecoveryCodes } from "@/components/MfaSetup";
import {
  signInWithPassword, updatePassword, listTotpFactors, unenrollTotp, signOutOtherSessions, getMfaPolicy, generateRecoveryCodes,
} from "@/api/auth";
import { Shield, Lock, KeyRound, LogOut, Check, Loader2, Smartphone, ShieldCheck, ShieldOff, LifeBuoy } from "lucide-react";
import { isAdmin } from "@/lib/roles";

const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

function TwoFactor() {
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

  const regenerate = async () => {
    if (policy?.recovery_remaining && !window.confirm("Les anciens codes de secours ne fonctionneront plus. Continuer ?")) return;
    setBusy(true);
    try {
      setCodes(await generateRecoveryCodes());
    } catch (e) {
      toast({ title: "Impossible", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard icon={Smartphone} title="Double authentification (2FA)">
      {factors === null ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : codes ? (
        <RecoveryCodes codes={codes} doneLabel="Terminé" onDone={() => { setCodes(null); load(); }} />
      ) : verified ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><ShieldCheck className="h-4 w-4" /> Activée — un code est demandé à chaque connexion.</p>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-slate-900"><LifeBuoy className="h-4 w-4 text-slate-400" /> Codes de secours</p>
            <p className="mt-1 text-slate-500">
              {policy ? `${policy.recovery_remaining} code(s) restant(s).` : ""} Ils permettent de vous reconnecter si vous perdez votre téléphone.
            </p>
            {policy && policy.recovery_remaining <= 2 && <p className="mt-1 text-xs text-amber-700">Pensez à générer de nouveaux codes.</p>}
            <button onClick={regenerate} disabled={busy} className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
              {policy?.recovery_remaining ? "Régénérer les codes" : "Générer mes codes"}
            </button>
          </div>
          {mandatory ? (
            <p className="text-xs text-slate-500">La 2FA est obligatoire pour votre rôle et ne peut pas être désactivée.</p>
          ) : (
            <button onClick={disable} disabled={busy} className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"><ShieldOff className="h-4 w-4" /> Désactiver</button>
          )}
        </div>
      ) : setup ? (
        <MfaSetup onDone={() => { setSetup(false); load(); toast({ title: "Double authentification activée" }); }} onCancel={() => setSetup(false)} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Protégez votre compte avec un code temporaire généré sur votre téléphone.</p>
          {(mandatory || isAdmin(user)) && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Obligatoire pour votre rôle : les actions sensibles exigent une session validée par 2FA.</p>}
          <button onClick={() => setSetup(true)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <ShieldCheck className="h-4 w-4" /> Activer la 2FA
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
