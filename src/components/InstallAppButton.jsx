import React, { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true || document.documentElement.classList.contains("is-native");
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

/**
 * "Installer l'app": uses the browser install prompt (Android / desktop
 * Chrome, Edge) and shows the Share → "Sur l'écran d'accueil" hint on iOS.
 * Hidden once the app runs installed.
 */
export default function InstallAppButton({ compact = false }) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState(() => window.__nelvinInstallPrompt || null);
  const [iosHint, setIosHint] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const update = () => {
      setPrompt(window.__nelvinInstallPrompt || null);
      setInstalled(isStandalone());
    };
    window.addEventListener("nelvin:installable", update);
    return () => window.removeEventListener("nelvin:installable", update);
  }, []);

  if (installed || (!prompt && !isIos())) return null;

  const install = async () => {
    if (prompt) {
      prompt.prompt();
      const choice = await prompt.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") setInstalled(true);
      window.__nelvinInstallPrompt = null;
      setPrompt(null);
    } else {
      setIosHint(true);
    }
  };

  return (
    <>
      <button onClick={install} className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100" aria-label={t("ac.installAria")}>
        <Download className="h-4 w-4" /> {!compact && t("ac.install")}
      </button>
      {iosHint && (
        <div className="fixed inset-x-4 bottom-24 z-50 rounded-2xl bg-slate-900 p-4 text-sm text-white shadow-xl md:bottom-6 md:left-auto md:right-6 md:w-80" role="dialog" aria-label={t("ac.installIos")}>
          <button onClick={() => setIosHint(false)} className="absolute right-3 top-3 text-white/60" aria-label={t("ac.close")}><X className="h-4 w-4" /></button>
          <p className="font-semibold">{t("ac.installIosT")}</p>
          <p className="mt-1 text-white/80">{t("ac.installIosD", { share: "\u0000" }).split("\u0000").flatMap((s, i, a) => (i < a.length - 1 ? [s, <Share key={i} className="mx-0.5 inline h-4 w-4" />] : [s]))}</p>
        </div>
      )}
    </>
  );
}
