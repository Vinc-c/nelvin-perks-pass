import React, { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import MfaSetup from "@/components/MfaSetup";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";

const SUB_KEY = { SUPER_ADMIN: "ac.mfa.gateSubSuper", admin: "ac.mfa.gateSubSuper", HR_ADMIN: "ac.mfa.gateSubHr" };

/** Shown after sign-in when 2FA is mandatory for the user's role and not set up yet. */
export default function MfaEnrollGate() {
  const { t } = useI18n();
  const { user, checkUserAuth, logout, setMfaGateHold } = useAuth();
  useEffect(() => { setMfaGateHold(true); }, [setMfaGateHold]);
  const done = async () => {
    setMfaGateHold(false);
    await checkUserAuth({ silent: true });
  };
  return (
    <AuthLayout
      icon={ShieldAlert}
      title={t("ac.mfa.gateTitle")}
      subtitle={t(SUB_KEY[user?.role] || "ac.mfa.gateSubOther")}
    >
      <MfaSetup onDone={done} />
      <button onClick={() => { setMfaGateHold(false); logout(true); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">{t("ui.signOut")}</button>
    </AuthLayout>
  );
}
