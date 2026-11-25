import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Mail, Phone } from "lucide-react";

const STATUSES = ["NEW", "CONTACTED", "CLOSED"];
const TOPICS = ["ALL", "DEMO", "PARTNER", "QUOTE", "SUPPORT", "OTHER"];
const TOPIC_BADGE = { DEMO: "bg-primary/10 text-primary", PARTNER: "bg-violet-100 text-violet-700", QUOTE: "bg-sky-100 text-sky-700", SUPPORT: "bg-orange-100 text-orange-700", OTHER: "bg-slate-100 text-slate-600" };
const BADGE = { NEW: "bg-red-100 text-red-700", CONTACTED: "bg-amber-100 text-amber-800", CLOSED: "bg-slate-100 text-slate-600" };

/** Contact-sales requests sent from /contact. Super admin, Sales and Support agents. */
export default function AdminContactRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("NEW");
  const [topic, setTopic] = useState("ALL");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    let q = supabase.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "ALL") q = q.eq("status", filter);
    if (topic !== "ALL") q = q.eq("topic", topic);
    const { data, error } = await q;
    if (error) { toast({ title: error.message, variant: "destructive" }); setRows([]); return; }
    setRows(data || []);
  }, [filter, topic, toast]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const update = async (r, status) => {
    try {
      await callRpc("staff_update_contact_request", { p_id: r.id, p_status: status, p_note: notes[r.id] ?? r.note ?? null });
      toast({ title: "Saved" }); load();
    } catch (e) { toast({ title: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Contact requests</h2>
        <p className="text-sm text-slate-500">Demo, partner, quote and support requests from the contact form. Staff are also emailed at the support address.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["ALL", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`nv-focus rounded-full border px-4 py-1.5 text-sm ${filter === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Topic">
        {TOPICS.map((x) => (
          <button key={x} onClick={() => setTopic(x)} className={`nv-focus rounded-full border px-3.5 py-1 text-xs font-medium ${topic === x ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-600"}`}>{x === "ALL" ? "All topics" : x.charAt(0) + x.slice(1).toLowerCase()}</button>
        ))}
      </div>
      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No requests here.</p>
      ) : rows.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">{r.full_name}{r.company ? ` · ${r.company}` : ""}
                {r.topic && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TOPIC_BADGE[r.topic] || TOPIC_BADGE.OTHER}`}>{r.topic}</span>}
                {r.details?.urgency === "urgent" && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">URGENT</span>}
                {r.reference && <span className="font-mono text-xs font-normal text-slate-500">{r.reference}</span>}</p>
              <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()} · {r.audience}{r.plan_code ? ` · ${r.plan_code}` : ""}{r.country ? ` · ${r.country}` : ""}{r.size ? ` · ${r.size}` : ""}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[r.status]}`}>{r.status}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.reference || "Nelvin"}`)}`} className="inline-flex items-center gap-1.5 text-nv-emerald hover:underline"><Mail className="h-4 w-4" />{r.email}</a>
            {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-nv-emerald hover:underline"><Phone className="h-4 w-4" />{r.phone}</a>}
          </div>
          {r.details && Object.keys(r.details).length > 0 && (
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {Object.entries(r.details).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="text-slate-500">{k.replace(/_/g, " ")}:</dt><dd className="min-w-0 break-words font-medium text-slate-800">{String(v)}</dd></div>
              ))}
            </dl>
          )}
          {r.message && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.message}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input aria-label="Internal note" placeholder="Internal note" value={notes[r.id] ?? r.note ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            {STATUSES.filter((s) => s !== r.status).map((s) => (
              <button key={s} onClick={() => update(r, s)} className="nv-focus rounded-full border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50">Mark {s.toLowerCase()}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
