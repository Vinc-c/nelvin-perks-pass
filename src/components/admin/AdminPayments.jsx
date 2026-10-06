import React, { useMemo, useState } from "react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { invokeFunction } from "@/api/functions";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { usePlans } from "@/hooks/usePlans";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import StatCard from "@/components/dashboard/StatCard";
import { TX_LABELS } from "@/pages/WalletActivity";
import { Banknote, ArrowUpRight, RefreshCw, Check, X, Clock, Gift, Download } from "lucide-react";

const TABS = [
  ["withdrawals", "Retraits membres"],
  ["payouts", "Paiements partenaires"],
  ["pending", "Paiements PSP en attente"],
  ["ledger", "Grand livre"],
  ["grant", "Abonnement manuel"],
];

/** Super admin finance operations: payouts, withdrawals, reconciliation. */
export default function AdminPayments() {
  const { toast } = useToast();
  const money = useCurrencies();
  const { plans } = usePlans();
  const [tab, setTab] = useState("withdrawals");
  const [busy, setBusy] = useState(null);
  const [grant, setGrant] = useState({ email: "", plan: "PASS_PREMIUM", cycle: "MONTHLY" });

  const { data, loading, reload } = useAsync(async () => {
    const [withdrawals, payouts, pending, ledger, profiles, merchants] = await Promise.all([
      entities.Transaction.filter({ type: "WITHDRAWAL", status: "PENDING" }, "created_date", 500),
      entities.PayoutRequest.filter({ status: "PENDING" }, "created_date", 500),
      entities.Transaction.filter({ type: ["RECHARGE", "SUBSCRIPTION", "COMPANY_TOPUP"], status: "PENDING" }, "-created_date", 200),
      entities.Transaction.list("-created_date", 300),
      entities.User.list("-created_date", 5000),
      entities.Merchant.list("name", 2000),
    ]);
    return {
      withdrawals, payouts, pending, ledger,
      people: new Map(profiles.map((p) => [p.id, p])),
      merchants: new Map(merchants.map((m) => [m.id, m])),
      profiles,
    };
  }, [], { initial: null });

  const totals = useMemo(() => data ? {
    withdrawals: data.withdrawals.reduce((s, t) => s + Number(t.amount_usd || 0), 0),
    payouts: data.payouts.reduce((s, p) => s + Number(p.amount_usd || 0), 0),
  } : null, [data]);

  if (loading || !data) return <Spinner />;

  const who = (id) => {
    const p = data.people.get(id);
    return p ? `${p.full_name || p.email} · ${p.email}` : id;
  };

  const act = async (key, fn, ok) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: ok });
      reload();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const withdrawal = (t, approve) => {
    const note = approve ? window.prompt("Référence du virement / Mobile Money (optionnel)") : window.prompt("Motif du refus (visible par le membre)");
    if (note === null) return;
    act(t.id, () => callRpc("admin_process_withdrawal", { p_tx_id: t.id, p_approve: approve, p_note: note || null }), approve ? "Retrait marqué comme payé" : "Retrait refusé et remboursé");
  };
  const payout = (p, approve) => {
    const note = approve ? window.prompt("Référence du paiement (optionnel)") : window.prompt("Motif du refus");
    if (note === null) return;
    act(p.id, () => callRpc("admin_process_payout", { p_id: p.id, p_approve: approve, p_note: note || null }), approve ? "Paiement marqué comme envoyé" : "Demande refusée, solde recrédité");
  };
  const recheck = (t) => act(t.id, async () => {
    const res = await invokeFunction("verify-payment", { transaction_id: t.id });
    if (!res.data?.ok) throw new Error(`Non confirmé (statut PSP : ${res.data?.status || res.data?.error})`);
  }, "Paiement confirmé et appliqué");

  const grantSub = (e) => {
    e.preventDefault();
    const user = data.profiles.find((p) => (p.email || "").toLowerCase() === grant.email.trim().toLowerCase());
    if (!user) return toast({ title: "Utilisateur introuvable", variant: "destructive" });
    act("grant", () => callRpc("admin_grant_subscription", { p_user_id: user.id, p_plan_code: grant.plan, p_cycle: grant.cycle }), "Abonnement attribué");
  };

  const exportLedger = () => {
    const header = ["date", "type", "statut", "utilisateur", "montant", "devise", "montant_usd", "cashback_usd", "reference"];
    const lines = data.ledger.map((t) => [t.created_date, t.type, t.status, data.people.get(t.user_id)?.email || t.user_id, t.amount, t.currency, t.amount_usd ?? "", t.cashback_amount || 0, t.psp_reference || ""].join(";"));
    const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nelvin-grand-livre-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const row = "flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between";

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ArrowUpRight} label="Retraits à traiter" value={`${data.withdrawals.length} · ${money.format(totals.withdrawals)}`} tone="rose" />
        <StatCard icon={Banknote} label="Paiements partenaires à envoyer" value={`${data.payouts.length} · ${money.format(totals.payouts)}`} tone="amber" delay={0.05} />
        <StatCard icon={Clock} label="Paiements PSP en attente" value={data.pending.length} tone="blue" delay={0.1} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === id ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{label}</button>
        ))}
      </div>

      {tab === "withdrawals" && (data.withdrawals.length === 0 ? <EmptyState icon={Check} title="Aucun retrait en attente" /> : data.withdrawals.map((t) => (
        <div key={t.id} className={row}>
          <div>
            <p className="font-semibold text-slate-900">{money.formatIn(t.amount, t.currency)} <span className="text-xs font-normal text-slate-500">({money.format(t.amount_usd)})</span></p>
            <p className="text-sm text-slate-600">{t.payment_method === "MOBILE_MONEY" ? "Mobile Money" : "Virement"} → <span className="font-mono">{t.destination}</span></p>
            <p className="text-xs text-slate-400">{who(t.user_id)} · {new Date(t.created_date).toLocaleString("fr-FR")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => withdrawal(t, true)} disabled={busy === t.id} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" /> Payé</button>
            <button onClick={() => withdrawal(t, false)} disabled={busy === t.id} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 disabled:opacity-50"><X className="h-4 w-4" /> Refuser</button>
          </div>
        </div>
      )))}

      {tab === "payouts" && (data.payouts.length === 0 ? <EmptyState icon={Check} title="Aucune demande en attente" /> : data.payouts.map((p) => (
        <div key={p.id} className={row}>
          <div>
            <p className="font-semibold text-slate-900">{money.format(p.amount_usd)} — {data.merchants.get(p.merchant_id)?.name || "Partenaire"}</p>
            <p className="text-sm text-slate-600">{p.method === "MOBILE_MONEY" ? "Mobile Money" : "Virement"} → <span className="font-mono">{p.destination}</span></p>
            <p className="text-xs text-slate-400">{who(p.requested_by)} · {new Date(p.created_date).toLocaleString("fr-FR")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => payout(p, true)} disabled={busy === p.id} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" /> Envoyé</button>
            <button onClick={() => payout(p, false)} disabled={busy === p.id} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 disabled:opacity-50"><X className="h-4 w-4" /> Refuser</button>
          </div>
        </div>
      )))}

      {tab === "pending" && (data.pending.length === 0 ? <EmptyState icon={Check} title="Aucun paiement en attente" /> : data.pending.map((t) => (
        <div key={t.id} className={row}>
          <div>
            <p className="font-semibold text-slate-900">{TX_LABELS[t.type]} · {money.formatIn(t.amount, t.currency)}</p>
            <p className="text-xs text-slate-500">{who(t.user_id)} · {new Date(t.created_date).toLocaleString("fr-FR")} · <span className="font-mono">{t.psp_reference}</span></p>
          </div>
          <button onClick={() => recheck(t)} disabled={busy === t.id} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy === t.id ? "animate-spin" : ""}`} /> Vérifier auprès du PSP</button>
        </div>
      )))}

      {tab === "ledger" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-end p-3"><button onClick={exportLedger} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"><Download className="h-4 w-4" /> CSV</button></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Utilisateur</th><th className="p-3 font-medium">Montant</th><th className="p-3 font-medium">Statut</th></tr></thead>
            <tbody>
              {data.ledger.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="p-3 text-slate-500">{new Date(t.created_date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="p-3">{TX_LABELS[t.type]}</td>
                  <td className="p-3 text-slate-600">{data.people.get(t.user_id)?.email || "—"}</td>
                  <td className="p-3 font-medium">{money.formatIn(t.amount, t.currency)}</td>
                  <td className="p-3 text-xs">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "grant" && (
        <form onSubmit={grantSub} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 font-semibold text-slate-900"><Gift className="h-5 w-5 text-amber-500" /> Attribuer un abonnement</p>
          <p className="mt-1 text-sm text-slate-500">Pour un paiement reçu hors ligne (virement, espèces) ou un geste commercial. Pour un plan entreprise, choisissez l'email d'un RH de l'entreprise.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <input required type="email" value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} placeholder="Email du compte" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
            <select value={grant.plan} onChange={(e) => setGrant({ ...grant, plan: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            <select value={grant.cycle} onChange={(e) => setGrant({ ...grant, cycle: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="MONTHLY">1 mois</option><option value="ANNUAL">12 mois</option>
            </select>
          </div>
          <button type="submit" disabled={busy === "grant"} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Attribuer</button>
        </form>
      )}
    </div>
  );
}
