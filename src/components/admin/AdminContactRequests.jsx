import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Mail, Phone } from "lucide-react";

const STATUSES = ["NEW", "CONTACTED", "CLOSED"];
const BADGE = { NEW: "bg-red-100 text-red-700", CONTACTED: "bg-amber-100 text-amber-800", CLOSED: "bg-slate-100 text-slate-600" };

/** Contact-sales requests sent from /contact. Super admin, Sales and Support agents. */
export default function AdminContactRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("NEW");
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    let q = supabase.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "ALL") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) { toast({ title: error.message, variant: "destructive" }); setRows([]); return; }
    setRows(data || []);
  }, [filter, toast]);
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
        <p className="text-sm text-slate-500">Companies and merchants who asked for a quote from the pricing page or contact form.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["ALL", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`nv-focus rounded-full border px-4 py-1.5 text-sm ${filter === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700"}`}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>
        ))}
      </div>
      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No requests here.</p>
      ) : rows.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{r.full_name}{r.company ? ` · ${r.company}` : ""}</p>
              <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()} · {r.audience}{r.plan_code ? ` · ${r.plan_code}` : ""}{r.country ? ` · ${r.country}` : ""}{r.size ? ` · ${r.size}` : ""}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[r.status]}`}>{r.status}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-nv-emerald hover:underline"><Mail className="h-4 w-4" />{r.email}</a>
            {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-nv-emerald hover:underline"><Phone className="h-4 w-4" />{r.phone}</a>}
          </div>
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
