import React, { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { listTotpFactors, verifyTotp } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";

/** Second step of sign-in for accounts with two-factor authentication. */
export default function MfaChallenge() {
  const { checkUserAuth, logout } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const [factor] = await listTotpFactors();
      if (!factor) throw new Error("Aucun facteur 2FA actif sur ce compte.");
      await verifyTotp(factor.id, code);
      await checkUserAuth({ silent: true });
    } catch (e) {
      setError(e.message || "Code invalide");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={ShieldCheck} title="Double authentification" subtitle="Saisissez le code à 6 chiffres de votre application d'authentification.">
      {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code" onComplete={submit}>
          <InputOTPGroup>
            <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
            <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button className="mt-6 h-12 w-full" onClick={submit} disabled={loading || code.length < 6}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Vérifier
      </Button>
      <button onClick={() => logout(true)} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">Se déconnecter</button>
    </AuthLayout>
  );
}
