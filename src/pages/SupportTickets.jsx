import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import TicketThread, { TICKET_STATUS, TICKET_CATEGORIES } from "@/components/support/TicketThread";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, ListSkeleton } from "@/components/UiFeedback";
import { useI18n } from "@/i18n/I18nContext";
import { MessageSquare, Plus, Loader2, LifeBuoy, X } from "lucide-react";

export default function SupportTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t: tr, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "PAYMENT", body: "" });
  const [busy, setBusy] = useState(false);

  const { data: tickets, loading, reload } = useAsync(
    () => (user ? entities.SupportTicket.filter({ user_id: user.id }, "-last_message_at", 100) : []),
    [user?.id],
    { initial: [] }
  );

  const selectedId = params.get("ticket");
  const selected = (tickets || []).find((t) => t.id === selectedId) || null;
  const select = (id) => setParams(id ? { ticket: id } : {});

  useEffect(() => {
    if (!selectedId && !creating && tickets?.length) select(tickets[0].id);
  }, [tickets]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const t = await entities.SupportTicket.create({ subject: form.subject.trim(), category: form.category, user_id: user.id });
      await entities.TicketMessage.create({ ticket_id: t.id, body: form.body.trim() });
      setForm({ subject: "", category: "PAYMENT", body: "" });
      setCreating(false);
      await reload();
      select(t.id);
      toast({ title: tr("sp.tk.created"), description: tr("sp.tk.createdD") });
    } catch (err) {
      toast({ title: tr("sp.t.sendFail"), description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    try {
      await entities.SupportTicket.update(selected.id, { status });
      reload();
    } catch (err) {
      toast({ title: tr("sp.tk.error"), description: err.message, variant: "destructive" });
    }
  };

  return (
    <PortalLayout title={tr("sp.tk.title")} theme="light">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <button onClick={() => { setCreating(true); select(null); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
            <Plus className="h-4 w-4" /> {tr("sp.tk.new")}
          </button>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title={tr("sp.tk.none")} description={tr("sp.tk.noneD")} />
          ) : (
            tickets.map((t) => (
              <button key={t.id} onClick={() => { setCreating(false); select(t.id); }} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === t.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">{t.subject}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${TICKET_STATUS[t.status]?.tone}`}>{TICKET_STATUS[t.status]?.label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{TICKET_CATEGORIES[t.category]} · {new Date(t.last_message_at).toLocaleDateString(locale)}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {creating ? (
            <SectionCard icon={MessageSquare} title={tr("sp.tk.new")} action={<button onClick={() => setCreating(false)} aria-label={tr("sp.tk.close")}><X className="h-4 w-4 text-slate-400" /></button>}>
              <form onSubmit={create} className="space-y-3">
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required minLength={3} maxLength={160} placeholder={tr("sp.tk.subject")} aria-label={tr("sp.tk.subject")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label={tr("sp.tk.category")} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                  {Object.entries(TICKET_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows={6} maxLength={5000} placeholder={tr("sp.tk.bodyPh")} aria-label={tr("sp.tk.body")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
                <button type="submit" disabled={busy || form.subject.trim().length < 3 || !form.body.trim()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {tr("sp.tk.send")}
                </button>
              </form>
            </SectionCard>
          ) : selected ? (
            <SectionCard icon={MessageSquare} title={selected.subject} action={
              selected.status === "CLOSED"
                ? <button onClick={() => setStatus("OPEN")} className="text-sm font-medium text-emerald-600 hover:underline">{tr("sp.tk.reopen")}</button>
                : <button onClick={() => setStatus("CLOSED")} className="text-sm font-medium text-slate-500 hover:underline">{tr("sp.tk.closeTicket")}</button>
            }>
              <TicketThread ticket={selected} onChange={reload} />
            </SectionCard>
          ) : (
            <EmptyState icon={MessageSquare} title={tr("sp.tk.select")} description={tr("sp.tk.selectD")} />
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
