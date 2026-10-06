import React, { useEffect, useRef, useState } from "react";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2, Headphones } from "lucide-react";

export const TICKET_STATUS = {
  OPEN: { label: "Ouvert", tone: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "En cours", tone: "bg-amber-100 text-amber-700" },
  RESOLVED: { label: "Résolu", tone: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Fermé", tone: "bg-slate-100 text-slate-600" },
};
export const TICKET_CATEGORIES = {
  ACCOUNT: "Compte", PAYMENT: "Paiement", WALLET: "Wallet", OFFER: "Offre", MERCHANT: "Partenaire", TECHNICAL: "Technique", OTHER: "Autre",
};
export const TICKET_PRIORITIES = { LOW: "Basse", NORMAL: "Normale", HIGH: "Haute", URGENT: "Urgente" };

/** Conversation of one ticket with live updates. */
export default function TicketThread({ ticket, onChange, staff = false }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      entities.TicketMessage.filter({ ticket_id: ticket.id }, "created_date", 500)
        .then((m) => alive && setMessages(m))
        .catch(() => {});
    load();
    const unsub = entities.TicketMessage.subscribe(load, { filter: `ticket_id=eq.${ticket.id}` });
    return () => {
      alive = false;
      unsub();
    };
  }, [ticket.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await entities.TicketMessage.create({ ticket_id: ticket.id, body: body.trim() });
      setBody("");
      const m = await entities.TicketMessage.filter({ ticket_id: ticket.id }, "created_date", 500);
      setMessages(m);
      onChange?.();
    } catch (err) {
      toast({ title: "Envoi impossible", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const closed = ticket.status === "CLOSED" && !staff;

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[50vh] flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun message.</p>}
        {messages.map((m) => {
          const mine = m.author_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-emerald-500 text-white" : m.is_staff ? "bg-amber-50 text-slate-800 ring-1 ring-amber-200" : "bg-slate-100 text-slate-800"}`}>
                {m.is_staff && !mine && <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700"><Headphones className="h-3 w-3" /> Support Nelvin</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100" : "text-slate-400"}`}>{new Date(m.created_date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {closed ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">Ticket fermé. Rouvrez-le pour répondre.</p>
      ) : (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={5000} placeholder="Votre message…" aria-label="Message" className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          <button type="submit" disabled={sending || !body.trim()} className="flex items-center justify-center rounded-xl bg-emerald-500 px-4 text-white hover:bg-emerald-600 disabled:opacity-50" aria-label="Envoyer">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  );
}
