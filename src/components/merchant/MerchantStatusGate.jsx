import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { Loader2, Store, Clock, XCircle } from "lucide-react";
import MerchantStatusCard from "./MerchantStatusCard";

// Shows the merchant's application status until their brand is VERIFIED.
export default function MerchantStatusGate({ children }) {
  const { user } = useAuth();
  const merchantId = user?.merchant_id;
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(!!merchantId);

  useEffect(() => {
    if (!merchantId) return;
    base44.entities.Merchant.get(merchantId)
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
      <MerchantStatusCard icon={Store} tone="blue" title="Finalisez votre candidature partenaire"
        text="Présentez votre marque et votre première offre. Notre équipe la valide, puis votre tableau de bord marchand s'active."
        cta={{ href: "/merchant#apply", label: "Remplir la candidature" }} />
    );
  }

  if (merchant.verified_status === "PENDING") {
    return (
      <MerchantStatusCard icon={Clock} tone="amber" title="Candidature en cours d'examen"
        text={`Merci ! « ${merchant.name} » est en cours de validation par notre équipe (2 à 3 jours ouvrés). Vous serez notifié dès l'activation.`} />
    );
  }

  if (merchant.verified_status === "REJECTED") {
    return (
      <MerchantStatusCard icon={XCircle} tone="rose" title="Candidature non retenue"
        text={`La candidature de « ${merchant.name} » n'a pas été validée. Contactez le support pour en savoir plus.`}
        cta={{ href: "/support-center", label: "Contacter le support" }} />
    );
  }

  return children;
}