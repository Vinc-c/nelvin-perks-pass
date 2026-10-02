import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { homeFor } from "@/lib/roles";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import PortalLayout from "@/components/PortalLayout";

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState("verifying"); // verifying | success | failed

  useEffect(() => {
    const psp = params.get("psp");
    const ref = params.get("ref");
    const providerRef =
      params.get("session_id") || params.get("transaction_id") || params.get("tx") || params.get("pt") || undefined;
    const status = params.get("status");

    // PSP redirect marked cancelled.
    if (status === "cancel") {
      setState("failed");
      return;
    }

    if (!psp || !ref) {
      setState("failed");
      return;
    }

    (async () => {
      try {
        const res = await base44.functions.invoke("VerifyPayment", { psp, ref, provider_ref: providerRef });
        const data = res.data || {};
        if (data.ok) {
          setState("success");
          await refreshUser();
          toast({ title: "Paiement confirmé", description: "Votre wallet a été rechargé." });
        } else {
          setState("failed");
          toast({ title: "Paiement non confirmé", description: data.error || data.status || "Réessayez.", variant: "destructive" });
        }
      } catch (e) {
        setState("failed");
        toast({ title: "Vérification échouée", description: e.message || "Réessayez.", variant: "destructive" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalLayout title="Confirmation de paiement">
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="mt-4 text-lg font-semibold text-slate-900">Vérification du paiement…</p>
            <p className="mt-1 text-sm text-slate-500">Nous confirmons votre transaction auprès du PSP.</p>
          </>
        )}

        {state === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">Paiement confirmé</p>
            <p className="mt-1 text-sm text-slate-500">Votre wallet Nelvin a été rechargé avec succès.</p>
            <Link to="/wallet-activity" className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              Voir mon activité
            </Link>
          </motion.div>
        )}

        {state === "failed" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <XCircle className="h-9 w-9 text-rose-600" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">Paiement non abouti</p>
            <p className="mt-1 text-sm text-slate-500">Le paiement n’a pas pu être confirmé. Vous pouvez réessayer.</p>
            <Link to={homeFor(user)} className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand">
              Retour à mon espace
            </Link>
          </>
        )}
      </div>
    </PortalLayout>
  );
}