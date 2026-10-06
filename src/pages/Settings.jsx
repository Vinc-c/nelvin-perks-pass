import React, { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { updateMe, requestPasswordReset } from "@/api/auth";
import { useToast } from "@/components/ui/use-toast";
import { User, Globe, Shield, Bell, Smartphone, Mail, Save, Loader2, Lock } from "lucide-react";

export default function Settings() {
  const { lang, setLang, languages } = useI18n();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(user?.phone || "");
  const [pushNotif, setPushNotif] = useState(user?.notif_push !== false);
  const [emailNotif, setEmailNotif] = useState(user?.notif_email === true);
  const [twoFA, setTwoFA] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateMe({ phone, notif_push: pushNotif, notif_email: emailNotif });
      await refreshUser();
      toast({ title: "Paramètres enregistrés", description: "Vos préférences ont été mises à jour." });
    } catch (e) {
      toast({ title: "Erreur", description: e.message || "Impossible d'enregistrer.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await requestPasswordReset(user.email);
      toast({ title: "Email envoyé", description: `Un lien de changement de mot de passe a été envoyé à ${user.email}.` });
    } catch (e) {
      toast({ title: "Erreur", description: e.message || "Impossible d'envoyer l'email.", variant: "destructive" });
    }
  };

  const name = user?.full_name || (user?.email ? user.email.split("@")[0] : "—");

  return (
    <PortalLayout title="Paramètres" theme="light">
      <RoleWelcomeHeader />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <SectionCard icon={User} title="Informations du profil">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">Nom complet</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <User className="h-4 w-4 text-slate-400" /> {name}
              </div>
            </div>
            <div>
              <span className="text-sm text-slate-500">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <Mail className="h-4 w-4 text-slate-400" /> {user?.email || "—"}
              </div>
            </div>
            <label className="block text-sm">
              <span className="text-slate-500">Téléphone</span>
              <div className="relative mt-1">
                <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 ..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-slate-900 outline-none focus:border-emerald-500" />
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Language */}
        <SectionCard icon={Globe} title="Langue">
          <p className="text-sm text-slate-500">Choisissez la langue de l'application.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${lang === l.code ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <span className="text-lg">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard icon={Shield} title="Sécurité">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Authentification à deux facteurs</p>
                  <p className="text-xs text-slate-500">Sécurité renforcée par OTP à la connexion</p>
                </div>
              </div>
              <button onClick={() => setTwoFA(!twoFA)} className={`relative h-6 w-11 rounded-full transition ${twoFA ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${twoFA ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <button onClick={sendPasswordReset} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Changer de mot de passe</button>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={Bell} title="Préférences de notification">
          <div className="space-y-3">
            {[
              { label: "Notifications push", desc: "Alertes en temps réel sur votre appareil", val: pushNotif, set: setPushNotif },
              { label: "Notifications email", desc: "Annonces & résumés par email", val: emailNotif, set: setEmailNotif },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{n.label}</p>
                  <p className="text-xs text-slate-500">{n.desc}</p>
                </div>
                <button onClick={() => n.set(!n.val)} className={`relative h-6 w-11 rounded-full transition ${n.val ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${n.val ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
        </button>
      </div>
    </PortalLayout>
  );
}