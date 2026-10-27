import React, { useEffect, useState } from "react";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { Loader2, Store, Clock, XCircle } from "lucide-react";
import MerchantStatusCard from "./MerchantStatusCard";
import { useI18n } from "@/i18n/I18nContext";

// Shows the merchant's application status until their brand is VERIFIED.
export default function MerchantStatusGate({ children }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const merchantId = user?.merchant_id;
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(!!merchantId);

  useEffect(() => {
    if (!merchantId) return;
    entities.Merchant.get(merchantId)
      .then(setMerchant)
      .catch(() => setMerchant(null))
      .finally(() => setLoading(false));
  }, [merchantId]);

  if (isAdmin(user)) return children;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (!merchant) {
    return (
      <MerchantStatusCard icon={Store} tone="blue" title={t("mc.gate.noMerchantTitle")}
        text={t("mc.gate.noMerchantText")}
        cta={{ href: "/merchant#apply", label: t("mc.gate.noMerchantCta") }} />
    );
  }

  if (merchant.verified_status === "PENDING") {
    return (
      <MerchantStatusCard icon={Clock} tone="amber" title={t("mc.gate.pendingTitle")}
        text={t("mc.gate.pendingText", { name: merchant.name })}
        cta={{ href: "/kyc-verification", label: t("mc.gate.pendingCta") }} />
    );
  }

  if (merchant.verified_status === "REJECTED") {
    return (
      <MerchantStatusCard icon={XCircle} tone="rose" title={t("mc.gate.rejectedTitle")}
        text={t("mc.gate.rejectedText", { name: merchant.name })}
        cta={{ href: "/support-center", label: t("mc.gate.rejectedCta") }} />
    );
  }

  return children;
}