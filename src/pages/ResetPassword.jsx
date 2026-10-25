import React, { useState } from "react";
import { Link } from "react-router-dom";
import { updatePassword } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/i18n/I18nContext";

export default function ResetPassword() {
  const { t } = useI18n();
  // The reset email link opens a temporary recovery session (handled by the
  // Supabase client on load); the user just picks a new password.
  const { isAuthenticated, authChecked } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("auth.err.mismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("auth.err.pwShort"));
      return;
    }
    setLoading(true);
    try {
      await updatePassword(newPassword);
      window.location.href = "/app";
    } catch (err) {
      setError(err.message || t("ac.reset.fail"));
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <AuthLayout icon={Lock} title={t("ac.reset.title")} subtitle={t("ac.reset.checking")}>
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </AuthLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("ac.reset.invalidTitle")}
        subtitle={t("ac.reset.invalidSub")}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t("ac.reset.requestNew")}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {t("ac.reset.incomplete")}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t("ac.reset.title")}
      subtitle={t("ac.reset.sub")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("ac.sec.newPw")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("ac.reset.confirmPw")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("ac.reset.updating")}
            </>
          ) : (
            t("ac.reset.submit")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
