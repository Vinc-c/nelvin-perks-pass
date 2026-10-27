import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { homeFor } from "@/lib/roles";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import PortalLayout from "@/components/PortalLayout";
import { useI18n } from "@/i18n/I18nContext";

const SUCCESS = {
  RECHARGE: { text: "mb.ret.recharge.text", to: "/wallet-activity", cta: "mb.ret.recharge.cta" },
  SUBSCRIPTION: { text: "mb.ret.subscription.text", to: "/billing-settings", cta: "mb.ret.subscription.cta" },
  COMPANY_TOPUP: { text: "mb.ret.topup.text", to: "/hr?section=benefits", cta: "mb.ret.topup.cta" },
  GIFT: { text: "mb.ret.gift.text", to: "/billing-settings", cta: "mb.ret.gift.cta" },
};

export default function PaymentReturn() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState("verifying"); // verifying | success | failed
  const [kind, setKind] = useState("RECHARGE");

  useEffect(() => {
    const ref = params.get("ref");
    const providerRef =
      params.get("session_id") || params.get("transaction_id") || params.get("tx") || params.get("pt") || undefined;
    const status = params.get("status");

    // PSP redirect marked cancelled.
    if (status === "cancel") {
      setState("failed");
      return;
    }

    if (!ref) {
      setState("failed");
      return;
    }

    (async () => {
      try {
        const res = await invokeFunction("verify-payment", { ref, provider_ref: providerRef });
        const data = res.data || {};
        if (data.ok) {
          setKind(data.type || "RECHARGE");
          setState("success");
          await refreshUser();
          toast({ title: t("mb.ret.confirmed"), description: t(SUCCESS[data.type || "RECHARGE"]?.text) });
        } else {
          setState("failed");
          toast({ title: t("mb.ret.notConfirmed"), description: data.error || data.status || t("mb.ret.retry"), variant: "destructive" });
        }
      } catch (e) {
        setState("failed");
        toast({ title: t("mb.ret.verifyFailed"), description: e.message || t("mb.ret.retry"), variant: "destructive" });
      }
    })();
  }, []);

  return (
    <PortalLayout title={t("mb.ret.pageTitle")}>
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">{t("mb.ret.verifying")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("mb.ret.verifyingSub")}</p>
          </>
        )}

        {state === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">{t("mb.ret.confirmed")}</p>
            <p className="mt-1 text-sm text-slate-500">{SUCCESS[kind]?.text ? t(SUCCESS[kind].text) : ""}</p>
            <Link to={SUCCESS[kind]?.to || "/wallet-activity"} className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              {t(SUCCESS[kind]?.cta || "mb.ret.recharge.cta")}
            </Link>
          </motion.div>
        )}

        {state === "failed" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <XCircle className="h-9 w-9 text-rose-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">{t("mb.ret.failedTitle")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("mb.ret.failedSub")}</p>
            <Link to={homeFor(user)} className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand">
              {t("mb.ret.back")}
            </Link>
          </>
        )}
      </div>
    </PortalLayout>
  );
}