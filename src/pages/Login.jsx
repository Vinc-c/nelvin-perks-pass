import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithPassword } from "@/api/auth";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import PhoneLogin from "@/components/auth/PhoneLogin";
import { useAuthProviders } from "@/hooks/usePlatformSetting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Loader2 } from "lucide-react";
import PasswordField from "@/components/auth/PasswordField";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useI18n } from "@/i18n/I18nContext";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const providers = useAuthProviders();
  const [mode, setMode] = useState("email");
  // Post-login destination (protected pages send users here with returnTo).
  // Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      // Each role lands on its own portal via /app (unless an explicit
      // returnTo destination was requested).
      window.location.href = returnTo !== "/" ? returnTo : "/app";
    } catch (err) {
      setError(err.message || t("auth.err.login"));
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout
      icon={LogIn}
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.createAccount")}
          </Link>
        </>
      }
    >
      <SocialAuthButtons redirectPath={returnTo !== "/" ? returnTo : "/app"} onError={setError} />

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("reg.or")}</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {providers.phone && (
        <div role="tablist" className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {[["email", "auth.tab.email"], ["phone", "auth.tab.phone"]].map(([id, key]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setError(""); }}
              className={`nv-focus rounded-lg py-2 transition ${mode === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t(key)}</button>
          ))}
        </div>
      )}
      {providers.phone && mode === "phone" ? (
        <PhoneLogin redirectTo={returnTo !== "/" ? returnTo : "/app"} onError={setError} />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder={t("auth.placeholderEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ps-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
              {t("auth.signingIn")}
            </>
          ) : (
            t("auth.signIn")
          )}
        </Button>
      </form>
      )}

      <p className="text-center text-sm text-muted-foreground mt-5">
        {t("auth.joining")}{" "}
        <Link to="/join" className="text-primary font-medium hover:underline">
          {t("auth.useHrCode")}
        </Link>
      </p>
    </AuthLayout>
  );
}