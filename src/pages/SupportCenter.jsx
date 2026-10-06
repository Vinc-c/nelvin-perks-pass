import React, { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import TicketThread, { TICKET_STATUS, TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/components/support/TicketThread";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { Headphones, Inbox, Clock, CheckCircle2, AlertTriangle, Search } from "lucide-react";

const PRIORITY_TONE = { LOW: "text-slate-400", NORMAL: "text-slate-500", HIGH: "text-amber-600", URGENT: "text-rose-600" };

/** Super admin help desk: every ticket of the platform. */
export default function SupportCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState("ACTIVE");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const { data, loading, reload } = useAsync(async () => {
    const [tickets, profiles] = await Promise.all([
      entities.SupportTicket.list("-last_message_at", 500),
      entities.User.list("-created_date", 2000),
    ]);
    const byId = new Map(profiles.map((p) => [p.id, p]));
    return tickets.map((t) => ({ ...t, requester: byId.get(t.user_id) }));
  }, [], { initial: [], enabled: isAdmin(user) });

  const tickets = data || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets
      .filter((t) => (status === "ACTIVE" ? ["OPEN", "IN_PROGRESS"].includes(t.status) : status === "ALL" ? true : t.status === status))
      .filter((t) => !q || [t.subject, t.requester?.email, t.requester?.full_name].some((s) => (s || "").toLowerCase().includes(q)));
  }, [tickets, status, query]);
  const selected = tickets.find((t) => t.id === selectedId) || null;

  if (!isAdmin(user)) return <Navigate to="/support-tickets" replace />;

  const update = async (patch) => {
    try {
      await entities.SupportTicket.update(selected.id, patch);
      reload();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const count = (s) => tickets.filter((t) => t.status === s).length;

  return (
    <PortalLayout title="Help desk" theme="light">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={Inbox} label="Ouverts" value={count("OPEN")} tone="blue" />
        <StatCard icon={Clock} label="En cours" value={count("IN_PROGRESS")} tone="amber" delay={0.05} />
        <StatCard icon={AlertTriangle} label="Urgents actifs" value={tickets.filter((t) => t.priority === "URGENT" && ["OPEN", "IN_PROGRESS"].includes(t.status)).length} tone="rose" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Résolus" value={count("RESOLVED") + count("CLOSED")} tone="emerald" delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {[["ACTIVE", "À traiter"], ["RESOLVED", "Résolus"], ["CLOSED", "Fermés"], ["ALL", "Tous"]].map(([v, l]) => (
              <button key={v} onClick={() => setStatus(v)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === v ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sujet, email, nom" aria-label="Rechercher" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          {loading ? <ListSkeleton rows={4} /> : filtered.length === 0 ? (
            <EmptyState icon={Headphones} title="Rien à traiter" description="Aucun ticket ne correspond à ce filtre." />
          ) : filtered.map((t) => (
            <button key={t.id} onClick={() => setSelectedId(t.id)} className={`w-full rounded-xl border p-3 text-left ${selectedId === t.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-900">{t.subject}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${TICKET_STATUS[t.status]?.tone}`}>{TICKET_STATUS[t.status]?.label}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {t.requester?.full_name || t.requester?.email || "—"} · {TICKET_CATEGORIES[t.category]} · <span className={PRIORITY_TONE[t.priority]}>{TICKET_PRIORITIES[t.priority]}</span>
              </p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <SectionCard icon={Headphones} title={selected.subject}>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">{selected.requester?.email} · {selected.requester?.role}</span>
                <select value={selected.status} onChange={(e) => update({ status: e.target.value })} aria-label="Statut" className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                  {Object.entries(TICKET_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </select>
                <select value={selected.priority} onChange={(e) => update({ priority: e.target.value })} aria-label="Priorité" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                  {Object.entries(TICKET_PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <TicketThread ticket={selected} onChange={reload} staff />
            </SectionCard>
          ) : (
            <EmptyState icon={Headphones} title="Sélectionnez un ticket" description="Les réponses du support notifient automatiquement l'utilisateur." />
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
