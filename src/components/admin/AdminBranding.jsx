import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { BannerView } from "@/components/company/CompanyBanner";

/** Marketing team: approve, correct or reject company dashboard branding proposals. */
export default function AdminBranding() {
  const { toast } = useToast();
  const { data: rows, loading, reload } = useAsync(() => entities.CompanyBranding.list("-submitted_at", 200), [], { initial: [] });
  const { data: companies } = useAsync(() => entities.Company.list("name", 500), [], { initial: [] });
  const name = Object.fromEntries(companies.map((c) => [c.id, `${c.name} · ${c.plan_tier}`]));
  const [edits, setEdits] = useState({});
  const [note, setNote] = useState({});
  const [filter, setFilter] = useState("PENDING");

  const act = async (r, action) => {
    try {
      await callRpc("review_company_branding", { p_company: r.company_id, p_action: action, p_note: note[r.company_id] || null, p_edits: edits[r.company_id] || null });
      toast({ title: action === "approve" ? "Branding approved and live" : "Branding rejected" });
      reload();
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading && !rows.length) return <Spinner />;
  const shown = rows.filter((r) => (filter === "PENDING" ? r.status === "PENDING" : r.status === filter));
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === s ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500"}`}>{s} ({rows.filter((r) => r.status === s).length})</button>
        ))}
      </div>
      {shown.length === 0 ? <EmptyState title={`No ${filter.toLowerCase()} branding`} description="Company proposals appear here for marketing review." /> : (
        <ul className="space-y-4">
          {shown.map((r) => {
            const v = { ...(r.status === "PENDING" ? r.pending : r), ...(edits[r.company_id] || {}) };
            return (
              <li key={r.company_id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-medium text-slate-900">{name[r.company_id] || r.company_id}</p>
                <BannerView live={v} />
                {r.status === "PENDING" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input value={v.welcome_title || ""} onChange={(e) => setEdits((x) => ({ ...x, [r.company_id]: { ...(x[r.company_id] || {}), welcome_title: e.target.value } }))} className="rounded-lg border border-slate-300 p-2 text-sm" aria-label="Welcome title" />
                    <input value={v.welcome_text || ""} onChange={(e) => setEdits((x) => ({ ...x, [r.company_id]: { ...(x[r.company_id] || {}), welcome_text: e.target.value } }))} className="rounded-lg border border-slate-300 p-2 text-sm" aria-label="Welcome message" />
                    <input value={note[r.company_id] || ""} onChange={(e) => setNote((x) => ({ ...x, [r.company_id]: e.target.value }))} placeholder="Note to the company (shown on rejection)" className="rounded-lg border border-slate-300 p-2 text-sm sm:col-span-2" />
                    <div className="flex gap-2 sm:col-span-2">
                      <button onClick={() => act(r, "approve")} className="flex items-center gap-1 rounded-lg bg-nv-emerald px-3 py-1.5 text-sm text-white"><Check className="h-4 w-4" /> Approve & publish</button>
                      <button onClick={() => act(r, "reject")} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /> Reject</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
