import React from "react";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/auth/AppleIcon";
import { signInWithGoogle, signInWithApple } from "@/api/auth";
import { useAuthProviders } from "@/hooks/usePlatformSetting";
import { useI18n } from "@/i18n/I18nContext";

/** Google / Apple buttons, shown according to Admin → Social & login. */
export default function SocialAuthButtons({ redirectPath = "/app", onError }) {
  const { t } = useI18n();
  const providers = useAuthProviders();
  const run = (fn, fallbackKey) => async () => {
    try { await fn(redirectPath); } catch (err) { onError?.(err.message || t(fallbackKey)); }
  };
  if (!providers.google && !providers.apple) return null;
  return (
    <div className="mb-6 space-y-3">
      {!!providers.google && (
        <Button type="button" variant="outline" className="h-12 w-full text-sm font-medium" onClick={run(signInWithGoogle, "auth.err.google")}>
          <GoogleIcon className="me-2 h-5 w-5" />{t("auth.google")}
        </Button>
      )}
      {!!providers.apple && (
        <Button type="button" variant="outline" className="h-12 w-full text-sm font-medium" onClick={run(signInWithApple, "auth.err.apple")}>
          <AppleIcon className="me-2 h-5 w-5" />{t("auth.apple")}
        </Button>
      )}
    </div>
  );
}
