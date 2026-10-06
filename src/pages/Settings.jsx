import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import CurrencySelect from "@/components/CurrencySelect";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/lib/AuthContext";
import { updateMe } from "@/api/auth";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { ROLE_LABELS } from "@/lib/roles";
import { User, Globe, Shield, Bell, Mail, Save, Loader2, Building2, ChevronRight } from "lucide-react";

const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

export default function Settings() {
  const { lang, setLang, languages } = useI18n();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", phone: "", country: "", city: "", wallet_currency: "USD" });
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const isHr = user?.role === "HR_ADMIN";

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      country: user.country || "",
      city: user.city || "",
      wallet_currency: user.wallet_currency || "USD",
    });
    if (isHr && user.company_id) entities.Company.get(user.company_id).then(setCompany).catch(() => setCompany(null));
  }, [user, isHr]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));
  const setC = (k) => (e) => setCompany((c) => ({ ...c, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await updateMe({
        full_name: form.full_name.trim().slice(0, 120) || null,
        phone: form.phone.trim().slice(0, 30) || null,
        country: form.country.trim().slice(0, 60) || null,
        city: form.city.trim().slice(0, 60) || null,
        wallet_currency: form.wallet_currency,
      });
      if (isHr && company) {
        await entities.Company.update(company.id, {
          name: (company.name || "").trim().slice(0, 120),
          industry: company.industry || null,
          country: company.country || null,
          contact_email: company.contact_email || null,
          logo_url: company.logo_url || null,
        });
      }
      await refreshUser();
      toast({ title: "Paramètres enregistrés" });
    } catch (e) {
      toast({ title: "Erreur", description: e.message || "Impossible d'enregistrer.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout title="Paramètres" theme="light">
      <RoleWelcomeHeader />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={User} title="Profil">
          <div className="space-y-3">
            <label className="block text-sm text-slate-500">Nom complet<input value={form.full_name} onChange={set("full_name")} className={input} /></label>
            <div>
              <span className="text-sm text-slate-500">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><Mail className="h-4 w-4 text-slate-400" /> {user?.email || "—"}</div>
            </div>
            <label className="block text-sm text-slate-500">Téléphone<input value={form.phone} onChange={set("phone")} placeholder="+225 …" className={input} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-500">Pays<input value={form.country} onChange={set("country")} className={input} /></label>
              <label className="block text-sm text-slate-500">Ville<input value={form.city} onChange={set("city")} className={input} /></label>
            </div>
            <p className="text-xs text-slate-400">Rôle : {ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        </SectionCard>

        <SectionCard icon={Globe} title="Langue & devise">
          <p className="text-sm text-slate-500">Langue de l'application</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {languages.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${lang === l.code ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <span className="text-lg">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">Devise d'affichage</p>
          <div className="mt-2"><CurrencySelect value={form.wallet_currency} onChange={set("wallet_currency")} /></div>
          <p className="mt-1 text-xs text-slate-400">Les soldes sont conservés en USD et convertis au taux Nelvin.</p>
        </SectionCard>

        {isHr && company && (
          <SectionCard icon={Building2} title="Entreprise">
            <div className="space-y-3">
              <label className="block text-sm text-slate-500">Raison sociale<input value={company.name || ""} onChange={setC("name")} className={input} /></label>
              <label className="block text-sm text-slate-500">Secteur<input value={company.industry || ""} onChange={setC("industry")} className={input} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-500">Pays<input value={company.country || ""} onChange={setC("country")} className={input} /></label>
                <label className="block text-sm text-slate-500">Email de contact<input type="email" value={company.contact_email || ""} onChange={setC("contact_email")} className={input} /></label>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard icon={Shield} title="Sécurité & notifications">
          <div className="space-y-2">
            <Link to="/security-settings" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><span className="flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /> Mot de passe, double authentification, sessions</span><ChevronRight className="h-4 w-4 text-slate-400" /></Link>
            <Link to="/notification-settings" className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><span className="flex items-center gap-2"><Bell className="h-4 w-4 text-slate-400" /> Préférences de notification</span><ChevronRight className="h-4 w-4 text-slate-400" /></Link>
          </div>
        </SectionCard>
      </div>

      <button onClick={save} disabled={saving} className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
      </button>
    </PortalLayout>
  );
}
