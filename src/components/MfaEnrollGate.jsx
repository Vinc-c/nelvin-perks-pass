import React, { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import MfaSetup from "@/components/MfaSetup";
import { useAuth } from "@/lib/AuthContext";

const ROLE_LABEL = { SUPER_ADMIN: "super admin", admin: "super admin", HR_ADMIN: "administrateur RH" };

/** Shown after sign-in when 2FA is mandatory for the user's role and not set up yet. */
export default function MfaEnrollGate() {
  const { user, checkUserAuth, logout, setMfaGateHold } = useAuth();
  useEffect(() => { setMfaGateHold(true); }, [setMfaGateHold]);
  const done = async () => {
    setMfaGateHold(false);
    await checkUserAuth({ silent: true });
  };
  return (
    <AuthLayout
      icon={ShieldAlert}
      title="Activez la double authentification"
      subtitle={`Elle est obligatoire pour les comptes ${ROLE_LABEL[user?.role] || "à accès sensible"}. Cela prend une minute.`}
    >
      <MfaSetup onDone={done} />
      <button onClick={() => { setMfaGateHold(false); logout(true); }} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">Se déconnecter</button>
    </AuthLayout>
  );
}
