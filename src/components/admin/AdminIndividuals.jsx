import React, { useState } from "react";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { Spinner } from "@/components/UiFeedback";
import { Users, Search, AlertTriangle, CreditCard, PiggyBank, X, CheckCircle2, Clock } from "lucide-react";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const money = (n, cur = "USD") => `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${cur}`;

const SUB_STYLE = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  TRIAL: "bg-sky-50 text-sky-700",
  PAST_DUE: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-amber-50 text-amber-700",
};
const TX_STYLE = { COMPLETED: "text-emerald-600", FAILED: "text-rose-600", PENDING: "text-amber-600" };

function Pill({ children, className = "" }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>{children}</span>;
}

function Detail({ id, onClose }) {
  const { data, loading } = useAsync(() => callRpc("admin_individual_detail", { p_user: id }), [id], { initial: null });
  const p = data?.profile;
  const txs = data?.transactions || [];
  const reds = data?.redemptions || [];
  const subs = data?.subscriptions || [];
  const failed = txs.filter((t) => t.status === "FAILED");
  const saved = reds.filter((r) => !["GENERATED", "EXPIRED", "CANCELLED"].includes(r.status))
    .reduce((s, r) => s + Number(r.discount_applied || 0) + Number(r.cashback_credited || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{p?.full_name || p?.email || "Member"}</h3>
            <p className="text-sm text-slate-500">{p?.email} {p?.phone ? `· ${p.phone}` : ""}</p>
            <p className="text-xs text-slate-400">{[p?.city, p?.country].filter(Boolean).join(", ")} · joined {fmtDate(p?.created_date)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {loading && !p ? <Spinner /> : (
          <div className="mt-5 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Saved</p><p className="text-lg font-bold text-emerald-800">{money(saved)}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Wallet</p><p className="text-lg font-bold text-slate-900">{money(p?.wallet_balance, p?.wallet_currency || "USD")}</p></div>
              <div className={`rounded-xl p-3 ${failed.length ? "bg-rose-50" : "bg-slate-50"}`}><p className={`text-xs ${failed.length ? "text-rose-700" : "text-slate-500"}`}>Failed payments</p><p className={`text-lg font-bold ${failed.length ? "text-rose-700" : "text-slate-900"}`}>{failed.length}</p></div>
            </div>

            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><CreditCard className="h-4 w-4" /> Subscriptions</h4>
              {subs.length === 0 ? <p className="text-sm text-slate-400">No subscriptions.</p> : subs.map((s) => (
                <div key={s.id} className="mb-1.5 flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{s.plan_type} <span className="text-xs text-slate-400">{s.billing_cycle}</span></span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">until {fmtDate(s.expires_at)} <Pill className={SUB_STYLE[s.status] || "bg-slate-100 text-slate-600"}>{s.status}</Pill></span>
                </div>
              ))}
            </section>

            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><AlertTriangle className="h-4 w-4" /> Payments & transactions</h4>
              {txs.length === 0 ? <p className="text-sm text-slate-400">No transactions.</p> : txs.map((t) => (
                <div key={t.id} className={`mb-1.5 rounded-lg border px-3 py-2 text-sm ${t.status === "FAILED" ? "border-rose-200 bg-rose-50/50" : "border-slate-100"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{t.type} · {money(t.amount, t.currency)}</span>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${TX_STYLE[t.status] || "text-slate-500"}`}>
                      {t.status === "COMPLETED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : t.status === "PENDING" ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{fmtDate(t.created_date)} · {t.payment_method || "—"} {t.description ? `· ${t.description}` : ""}</p>
                  {t.status === "FAILED" && t.admin_note && <p className="mt-1 break-words text-xs text-rose-600">Cause: {t.admin_note}</p>}
                </div>
              ))}
            </section>

            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><PiggyBank className="h-4 w-4" /> Offer usage</h4>
              {reds.length === 0 ? <p className="text-sm text-slate-400">No offers used.</p> : reds.map((r) => (
                <div key={r.id} className="mb-1.5 flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span><span className="font-medium text-slate-800">{r.offer_title || "Offer"}</span> <span className="text-xs text-slate-400">· {r.merchant_name || ""}</span></span>
                  <span className="text-xs text-slate-500">{r.status} · −{money(Number(r.discount_applied || 0) + Number(r.cashback_credited || 0), r.bill_currency || "USD")}</span>
                </div>
              ))}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Super admin: every individual member, their subscription, payment issues and savings. */
export default function AdminIndividuals() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const { data, loading } = useAsync(() => callRpc("admin_list_individuals", { p_search: search.trim() || null }), [search], { initial: [] });
  const rows = Array.isArray(data) ? data : [];

  const shown = rows.filter((r) =>
    filter === "issues" ? r.failed_payments > 0 || r.sub_status === "PAST_DUE"
    : filter === "paying" ? r.sub_status === "ACTIVE"
    : filter === "nosub" ? !r.sub_status
    : true);
  const totalSaved = rows.reduce((s, r) => s + Number(r.saved_usd || 0), 0);

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Individuals", value: rows.length },
          { label: "Active subscribers", value: rows.filter((r) => r.sub_status === "ACTIVE").length },
          { label: "With payment issues", value: rows.filter((r) => r.failed_payments > 0).length },
          { label: "Total saved", value: money(totalSaved) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-sm text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, country…" aria-label="Search individuals" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[["all", "All"], ["paying", "Subscribers"], ["nosub", "No subscription"], ["issues", "Issues"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === k ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {loading && rows.length === 0 ? <Spinner /> : shown.length === 0 ? (
          <p className="flex items-center gap-2 p-8 text-sm text-slate-400"><Users className="h-4 w-4" /> No individuals.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">Subscription</th><th className="px-4 py-3">Payments</th><th className="px-4 py-3 text-right">Saved</th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{r.full_name || "—"}</p><p className="text-xs text-slate-400">{r.email}</p></td>
                  <td className="px-4 py-3 text-slate-600">{r.country || "—"}</td>
                  <td className="px-4 py-3">{r.sub_status ? <><Pill className={SUB_STYLE[r.sub_status] || "bg-slate-100 text-slate-600"}>{r.plan_type} · {r.sub_status}</Pill><p className="mt-0.5 text-[11px] text-slate-400">until {fmtDate(r.sub_expires_at)}</p></> : <span className="text-xs text-slate-400">None</span>}</td>
                  <td className="px-4 py-3">
                    {r.failed_payments > 0 ? <Pill className="bg-rose-50 text-rose-700">{r.failed_payments} failed</Pill> : <span className="text-xs text-slate-400">OK</span>}
                    {r.pending_payments > 0 && <Pill className="ml-1 bg-amber-50 text-amber-700">{r.pending_payments} pending</Pill>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{money(r.saved_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {openId && <Detail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
