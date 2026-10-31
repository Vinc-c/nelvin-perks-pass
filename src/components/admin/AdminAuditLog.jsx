import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { ScrollText, Search } from "lucide-react";

const ACTIONS = {
  "admin.add": "Super admin added",
  "admin.remove": "Super admin removed",
  "psp.secret.set": "PSP key saved",
  "psp.secret.clear": "PSP key deleted",
  "psp.update": "PSP settings updated",
  "withdrawal.approve": "Withdrawal paid",
  "withdrawal.reject": "Withdrawal rejected",
  "payout.approve": "Partner payout sent",
  "payout.reject": "Partner payout rejected",
  "subscription.grant": "Subscription granted",
  "merchant.verified": "Partner verified",
  "merchant.rejected": "Partner rejected",
  "merchant.pending": "Partner set back to pending",
  "company.update": "Company updated",
  "currency.update": "Exchange rate updated",
  "plan.update": "Plan updated",
};

/** Super admin: immutable trail of sensitive administrative actions. */
export default function AdminAuditLog() {
  const [query, setQuery] = useState("");
  const { data: rows, loading } = useAsync(() => entities.AdminAuditLog.list("-created_date", 500), [], { initial: [] });
  if (loading && !rows.length) return <Spinner />;
  const q = query.trim().toLowerCase();
  const list = rows.filter((r) => !q || [r.action, r.actor_email, r.entity_id, ACTIONS[r.action]].some((s) => (s || "").toLowerCase().includes(q)));
  return (
    <div className="mt-6 space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Action, admin, entity" aria-label="Filter the log" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
      </div>
      {list.length === 0 ? <EmptyState icon={ScrollText} title="Log is empty" description="Sensitive super admin actions will appear here." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Admin</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Object</th><th className="p-3 font-medium">Details</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 align-top">
                  <td className="whitespace-nowrap p-3 text-slate-500">{new Date(r.created_date).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="p-3 text-slate-700">{r.actor_email || "system"}</td>
                  <td className="p-3 font-medium text-slate-900">{ACTIONS[r.action] || r.action}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{r.entity}{r.entity_id ? ` · ${r.entity_id}` : ""}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{Object.keys(r.details || {}).length ? JSON.stringify(r.details) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
