import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { checkVpn, onVpnChange } from "@/lib/vpn";

/** Warns signed-in members using a VPN/proxy; payments and withdrawals are paused meanwhile. */
export default function VpnBanner() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [vpn, setVpn] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setVpn(false); return undefined; }
    const off = onVpnChange(setVpn);
    const run = () => { if (document.visibilityState === "visible") checkVpn({ force: true }).then(setVpn); };
    run();
    const timer = setInterval(run, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", run);
    return () => { off(); clearInterval(timer); document.removeEventListener("visibilitychange", run); };
  }, [isAuthenticated]);

  if (!vpn) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[60] flex items-start gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{t("vpn.banner")}</p>
    </div>
  );
}
