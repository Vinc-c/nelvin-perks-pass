import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { invokeFunction } from "@/api/functions";
import { updateMe } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";
import { isOnboarded, homeFor } from "@/lib/roles";
import AuthLayout from "@/components/AuthLayout";
import AccountTypePicker, { ACCOUNT_TYPES } from "@/components/AccountTypePicker";
import CompanyFields from "@/components/CompanyFields";
import PartnerApplicationForm from "@/components/partner/PartnerApplicationForm";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nContext";
import { Sparkles, Loader2, ArrowRight, Store, ShieldCheck } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { t } = useI18n();
  const requested = new URLSearchParams(window.location.search).get("type");
  const [type, setType] = useState(ACCOUNT_TYPES.some((a) => a.v === requested) ? requested : "particulier");
  const [company, setCompany] = useState({ name: "", country: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isOnboarded(user)) return <Navigate to={homeFor(user)} replace />;

  // Invited employees already have their role + company linked via the invite
  // code; they still must pass through onboarding, so show a one-step welcome
  // screen that flags the account as onboarded before opening their portal.
  if (user?.role === "EMPLOYEE" && user?.company_id) {
    const completeEmployee = async () => {
      setError("");
      setLoading(true);
      try {
        await updateMe({ onboarded: true });
        window.location.href = "/employee";
      } catch (err) {
        setError(err.response?.data?.error || err.message || t("mb.ob.empFail"));
        setLoading(false);
      }
    };
    return (
      <AuthLayout icon={ShieldCheck} title={t("mb.ob.empTitle")} subtitle={t("mb.ob.empSub")}>
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <Button className="h-12 w-full font-medium" disabled={loading} onClick={completeEmployee}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("mb.ob.setting")}</> : <>{t("mb.ob.goSpace")} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </AuthLayout>
    );
  }

  // Particulier / Entreprise (RH) : collecte simple puis configuration du compte.
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (type === "entreprise" && !company.name.trim()) return setError(t("mb.ob.needCompany"));
    setLoading(true);
    try {
      const res = await invokeFunction("setup-account", {
        account_type: type,
        company_name: company.name,
        country: company.country,
      });
      window.location.href = res.data?.home || "/app";
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("mb.ob.setupFail"));
      setLoading(false);
    }
  };

  // Marchand (partenaire) : wizard de candidature, puis attente de validation Nelvin.
  if (type === "marchand") {
    return (
      <div className="min-h-screen bg-slate-50 pb-16 pt-10 font-body text-slate-900">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{t("mb.ob.partnerTitle")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("mb.ob.partnerSub")}
            </p>
          </div>
          <AccountTypePicker value={type} onChange={setType} />
          <div className="mt-6">
            <PartnerApplicationForm
              defaults={{ email: user?.email || "", contactName: user?.full_name || "", contactPhone: user?.phone || "" }}
              onSubmitted={() => { window.location.href = "/merchant-dashboard"; }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout icon={Sparkles} title={t("mb.ob.title")} subtitle={t("mb.ob.sub")}>
      <form onSubmit={submit} className="space-y-5">
        <AccountTypePicker value={type} onChange={setType} />
        {type === "entreprise" && <CompanyFields value={company} onChange={setCompany} />}
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("mb.ob.setting")}</> : <>{t("mb.ob.continue")} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </AuthLayout>
  );
}