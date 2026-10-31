import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { randomCode } from "@/lib/codes";
import { Search, Plus, Copy, Check, Trash2, TrendingUp, DollarSign, Activity, X } from "lucide-react";

const genCode = () => randomCode(8);

export default function AdminSalesCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ agent_name: "", agent_email: "", agent_phone: "", region: "", commission_rate: 5 });
  const [copied, setCopied] = useState(null);
  const [logFor, setLogFor] = useState(null);
  const [logAmount, setLogAmount] = useState("");

  const load = async () => {
    setLoading(true);
    try { setCodes(await entities.SalesCode.list("-created_date", 100)); } catch { setCodes([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.agent_name) return;
    try {
      await entities.SalesCode.create({
        code: genCode(),
        agent_name: draft.agent_name,
        agent_email: draft.agent_email,
        agent_phone: draft.agent_phone,
        region: draft.region,
        commission_rate: Number(draft.commission_rate) / 100,
        status: "ACTIVE",
        sales_count: 0, total_revenue: 0, total_commission: 0,
      });
      setShowCreate(false);
      setDraft({ agent_name: "", agent_email: "", agent_phone: "", region: "", commission_rate: 5 });
      load();
    } catch {}
  };

  const toggle = async (c) => { try { await entities.SalesCode.update(c.id, { status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }); load(); } catch {} };
  const remove = async (c) => { try { await entities.SalesCode.delete(c.id); load(); } catch {} };
  const copy = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };

  const logSale = async () => {
    const amt = Number(logAmount);
    if (!amt || amt <= 0 || !logFor) return;
    const c = codes.find((x) => x.id === logFor);
    const rate = c.commission_rate || 0;
    try {
      await entities.SalesCode.update(logFor, {
        sales_count: (c.sales_count || 0) + 1,
        total_revenue: (c.total_revenue || 0) + amt,
        total_commission: (c.total_commission || 0) + amt * rate,
      });
      setLogFor(null); setLogAmount(""); load();
    } catch {}
  };

  const filtered = codes.filter((c) => `${c.code} ${c.agent_name} ${c.region}`.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = codes.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const totalCommission = codes.reduce((s, c) => s + (c.total_commission || 0), 0);

  return (
    <div className="mt-6 space-y-5">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Activity, label: "Active codes", value: codes.filter((c) => c.status === "ACTIVE").length, color: "blue" },
          { icon: DollarSign, label: "Tracked sales", value: `$${totalRevenue.toLocaleString()}`, color: "emerald" },
          { icon: TrendingUp, label: "Commissions", value: `$${totalCommission.toLocaleString()}`, color: "amber" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-50`}><Icon className={`h-5 w-5 text-${s.color}-600`} /></div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for a code or sales agent…" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showCreate ? "Cancel" : "New sales code"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-slate-500">Agent name
              <input value={draft.agent_name} onChange={(e) => setDraft({ ...draft, agent_name: e.target.value })} placeholder="Aicha Diallo" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </label>
            <label className="text-xs text-slate-500">Email
              <input value={draft.agent_email} onChange={(e) => setDraft({ ...draft, agent_email: e.target.value })} placeholder="aicha@nelvin.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </label>
            <label className="text-xs text-slate-500">Phone
              <input value={draft.agent_phone} onChange={(e) => setDraft({ ...draft, agent_phone: e.target.value })} placeholder="+237…" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </label>
            <label className="text-xs text-slate-500">Region
              <input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="Afrique Centrale" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </label>
            <label className="text-xs text-slate-500">Commission (%)
              <input type="number" min="0" max="50" value={draft.commission_rate} onChange={(e) => setDraft({ ...draft, commission_rate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
            </label>
          </div>
          <button onClick={create} className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700">Generate code</button>
        </motion.div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Sales agent</th>
                <th className="p-4 font-medium">Commission</th>
                <th className="p-4 font-medium">Sales</th>
                <th className="p-4 font-medium">Revenue</th>
                <th className="p-4 font-medium">Commission earned</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">No sales codes.</td></tr>
              ) : filtered.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-50">
                  <td className="p-4">
                    <button onClick={() => copy(c.code)} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-200">
                      {c.code} {copied === c.code ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{c.agent_name}</p>
                    <p className="text-xs text-slate-400">{c.region} · {c.agent_email}</p>
                  </td>
                  <td className="p-4 text-slate-600">{Math.round((c.commission_rate || 0) * 100)}%</td>
                  <td className="p-4 text-slate-600">{c.sales_count || 0}</td>
                  <td className="p-4 font-semibold text-emerald-600">${(c.total_revenue || 0).toLocaleString()}</td>
                  <td className="p-4 font-medium text-amber-600">${(c.total_commission || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setLogFor(logFor === c.id ? null : c.id)} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200">+ Sale</button>
                      <button onClick={() => toggle(c)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200">{c.status === "ACTIVE" ? "Pause" : "Activate"}</button>
                      <button onClick={() => remove(c)} className="rounded-lg bg-rose-100 p-1.5 text-rose-600 hover:bg-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log sale inline bar */}
      {logFor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Log a sale for <span className="font-mono text-emerald-600">{codes.find((x) => x.id === logFor)?.code}</span></span>
            <input type="number" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} placeholder="Amount $" className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" />
            <button onClick={logSale} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Confirm</button>
            <button onClick={() => setLogFor(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
        </motion.div>
      )}
    </div>
  );
}