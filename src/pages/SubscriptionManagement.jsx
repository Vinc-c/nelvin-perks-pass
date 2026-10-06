import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import CheckoutModal from "@/components/CheckoutModal";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { usePlans } from "@/hooks/usePlans";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { downloadReceipt } from "@/lib/receipts";
import { audienceFor } from "@/pages/MembershipTiers";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { useToast } from "@/components/ui/use-toast";
import { Crown, Calendar, Receipt, Download, Building2, Wallet, Plus, AlertTriangle, Users } from "lucide-react";

const isLive = (s) => s.status === "ACTIVE" && (!s.expires_at || new Date(s.expires_at) > new Date());

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const { byCode } = usePlans();
  const audience = audienceFor(user);
  const [topupOpen, setTopupOpen] = useState(false);
  const [renew, setRenew] = useState(null);

  const { data, loading, reload } = useAsync(async () => {
    if (!user) return null;
    let subs;
    let payments;
    let company = null;
    if (audience === "B2B" && user.company_id) {
      [subs, payments, company] = await Promise.all([
        entities.Subscription.filter({ company_id: user.company_id }, "-created_date", 50),
        entities.Transaction.filter({ company_id: user.company_id, type: ["SUBSCRIPTION", "COMPANY_TOPUP"] }, "-created_date", 100),
        entities.Company.get(user.company_id).catch(() => null),
      ]);
    } else if (audience === "MERCHANT" && user.merchant_id) {
      [subs, payments] = await Promise.all([
        entities.Subscription.filter({ merchant_id: user.merchant_id }, "-created_date", 50),
        entities.Transaction.filter({ user_id: user.id, type: "SUBSCRIPTION" }, "-created_date", 100),
      ]);
    } else {
      [subs, payments] = await Promise.all([
        entities.Subscription.filter({ user_id: user.id, company_id: null, merchant_id: null }, "-created_date", 50),
        entities.Transaction.filter({ user_id: user.id, type: "SUBSCRIPTION" }, "-created_date", 100),
      ]);
    }
    return { subs, payments, company };
  }, [user?.id, audience]);

  if (loading || !data) return <PortalLayout title="Abonnement & facturation" theme="light"><Spinner /></PortalLayout>;

  const current = data.subs.find(isLive);
  const plan = current ? byCode(current.plan_type) : null;
  const company = data.company;
  const trial = company?.subscription_status === "TRIAL";
  const daysLeft = current?.expires_at ? Math.ceil((new Date(current.expires_at) - Date.now()) / 86400000) : null;

  const cancel = async () => {
    if (!current || !confirm("Arrêter le renouvellement ? Votre accès reste actif jusqu'à la fin de la période payée.")) return;
    try {
      await callRpc("cancel_subscription", { p_subscription_id: current.id });
      toast({ title: "Renouvellement arrêté" });
      reload();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <PortalLayout title="Abonnement & facturation" theme="light">
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
          <Crown className="h-7 w-7" />
          <p className="mt-2 text-sm text-amber-50">Plan actuel</p>
          <h2 className="text-2xl font-bold">{plan?.name || (trial ? `Essai gratuit — ${company?.plan_tier}` : "Aucun abonnement")}</h2>
          {current ? (
            <>
              <p className="mt-1 text-sm text-amber-50">{current.cancel_at_period_end ? "Se termine" : "Valable"} le {new Date(current.expires_at).toLocaleDateString("fr-FR")} ({daysLeft} j)</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-amber-50"><Calendar className="h-4 w-4" /> Facturation {current.billing_cycle === "ANNUAL" ? "annuelle" : "mensuelle"}</p>
            </>
          ) : trial ? (
            <p className="mt-1 text-sm text-amber-50">Choisissez un plan avant la fin de l'essai pour garder l'accès.</p>
          ) : (
            <p className="mt-1 text-sm text-amber-50">Accès gratuit aux offres publiques.</p>
          )}
        </motion.div>

        <SectionCard className="lg:col-span-2" title="Gérer">
          <div className="flex flex-wrap gap-2">
            <Link to="/membership-plans" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">{current ? "Changer de plan" : "Choisir un plan"}</Link>
            {current && plan && (
              <button onClick={() => setRenew(plan)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Prolonger maintenant</button>
            )}
            {current && !current.cancel_at_period_end && current.psp_used !== "MANUAL" && (
              <button onClick={cancel} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Arrêter le renouvellement</button>
            )}
          </div>
          {daysLeft != null && daysLeft <= 7 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" /> Votre abonnement expire bientôt : prolongez-le pour ne pas perdre l'accès.</p>
          )}
          <p className="mt-4 text-xs text-slate-500">Les abonnements ne sont jamais prélevés automatiquement : vous payez chaque période (en ligne ou avec votre wallet) et pouvez prolonger à tout moment — la nouvelle période s'ajoute à la période en cours.</p>
        </SectionCard>
      </div>

      {audience === "B2B" && company && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Wallet className="h-4 w-4" /> Budget avantages</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{money.format(company.wallet_balance, currency)}</p>
            <button onClick={() => setTopupOpen(true)} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline"><Plus className="h-4 w-4" /> Alimenter</button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> Sièges</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{company.seats_used} / {company.max_employees >= 100000 ? "∞" : company.max_employees}</p>
            <p className="mt-1 text-xs text-slate-500">Passez au plan supérieur pour inviter plus d'employés.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Building2 className="h-4 w-4" /> Entreprise</p>
            <p className="mt-2 truncate text-lg font-bold text-slate-900">{company.name}</p>
            <p className="mt-1 text-xs text-slate-500">Statut : {company.subscription_status}</p>
          </div>
        </div>
      )}

      <SectionCard icon={Receipt} title="Paiements & reçus" className="mt-6">
        {data.payments.length === 0 ? (
          <EmptyState icon={Receipt} title="Aucun paiement" description="Vos paiements d'abonnement apparaîtront ici avec leur reçu PDF." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Objet</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-3 text-slate-500">{new Date(t.created_date).toLocaleDateString("fr-FR")}</td>
                    <td className="py-3 text-slate-900">{t.description || t.type}</td>
                    <td className="py-3 font-medium text-slate-900">{money.formatIn(t.amount, t.currency)}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : t.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {t.status === "COMPLETED" ? "Payé" : t.status === "PENDING" ? "En attente" : "Échoué"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {t.status === "COMPLETED" && (
                        <button onClick={() => downloadReceipt(t, { user, company })} className="inline-flex items-center gap-1 text-emerald-600 hover:underline"><Download className="h-4 w-4" /> PDF</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <CheckoutModal open={topupOpen} purpose="COMPANY_TOPUP" onClose={() => { setTopupOpen(false); reload(); }} />
      <CheckoutModal open={!!renew} plan={renew} cycle={current?.billing_cycle || "MONTHLY"} purpose="SUBSCRIPTION" onClose={() => { setRenew(null); reload(); }} onPaid={reload} />
    </PortalLayout>
  );
}
