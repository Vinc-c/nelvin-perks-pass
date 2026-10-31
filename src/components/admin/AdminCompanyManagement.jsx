import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { Building2, Search, Plus, Crown, TrendingUp, Users, Save, X } from "lucide-react";

const PLAN_PRICE = { STARTER: 4, GROWTH: 12, ENTERPRISE: 30 };

export default function AdminCompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", industry: "", country: "", plan_tier: "STARTER", billing_cycle: "MONTHLY", max_employees: 15, contact_email: "" });

  const load = async () => {
    setLoading(true);
    try {
      const list = await entities.Company.list("-created_date", 100);
      setCompanies(list);
    } catch { setCompanies([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const mrr = (c) => (PLAN_PRICE[c.plan_tier] || 0) * (c.billing_cycle === "ANNUAL" ? 12 : 1);

  const patch = async (c, data) => {
    try { await entities.Company.update(c.id, data); load(); } catch {}
  };

  const create = async () => {
    if (!draft.name) return;
    try {
      await entities.Company.create({ ...draft, max_employees: Number(draft.max_employees) || 15, subscription_status: "TRIAL", seats_used: 0, total_saved: 0 });
      setShowAdd(false);
      setDraft({ name: "", industry: "", country: "", plan_tier: "STARTER", billing_cycle: "MONTHLY", max_employees: 15, contact_email: "" });
      load();
    } catch {}
  };

  const filtered = companies.filter((c) => `${c.name} ${c.industry} ${c.country}`.toLowerCase().includes(search.toLowerCase()));
  const totalMRR = companies.reduce((s, c) => s + mrr(c), 0);

  return (
    <div className="mt-6 space-y-5">
      {/* Premium KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Building2, label: "Companies", value: companies.length, color: "blue" },
          { icon: Crown, label: "Enterprise accounts", value: companies.filter((c) => c.plan_tier === "ENTERPRISE").length, color: "amber" },
          { icon: TrendingUp, label: "Estimated MRR", value: `$${totalMRR.toLocaleString()}`, color: "emerald" },
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies…" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showAdd ? "Cancel" : "New company"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { k: "name", l: "Name", ph: "Acme Corp" },
              { k: "industry", l: "Industry", ph: "Fintech" },
              { k: "country", l: "Country", ph: "Cameroon" },
              { k: "contact_email", l: "Contact email", ph: "hr@acme.com" },
            ].map((f) => (
              <label key={f.k} className="text-xs text-slate-500">{f.l}
                <input value={draft[f.k]} onChange={(e) => setDraft({ ...draft, [f.k]: e.target.value })} placeholder={f.ph} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
              </label>
            ))}
            <label className="text-xs text-slate-500">Plan
              <select value={draft.plan_tier} onChange={(e) => setDraft({ ...draft, plan_tier: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                <option value="STARTER">Starter</option><option value="GROWTH">Growth</option><option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">Billing
              <select value={draft.billing_cycle} onChange={(e) => setDraft({ ...draft, billing_cycle: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
                <option value="MONTHLY">Monthly</option><option value="ANNUAL">Annual</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">Max seats
              <input type="number" value={draft.max_employees} onChange={(e) => setDraft({ ...draft, max_employees: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
            </label>
          </div>
          <button onClick={create} className="mt-4 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Save className="h-4 w-4" /> Create company</button>
        </motion.div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Seats</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">MRR</th>
                <th className="p-4 font-medium">Savings</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">No companies found.</td></tr>
              ) : filtered.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-50">
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.industry} · {c.country}</p>
                  </td>
                  <td className="p-4">
                    <select value={c.plan_tier} onChange={(e) => patch(c, { plan_tier: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="STARTER">Starter</option><option value="GROWTH">Growth</option><option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-slate-600"><Users className="h-3.5 w-3.5" /> {c.seats_used || 0}/{c.max_employees}</span>
                  </td>
                  <td className="p-4">
                    <select value={c.subscription_status} onChange={(e) => patch(c, { subscription_status: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none">
                      <option value="TRIAL">Trial</option><option value="ACTIVE">Active</option><option value="PAST_DUE">Past due</option><option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 font-semibold text-emerald-600">${mrr(c)}</td>
                  <td className="p-4 text-slate-600">${(c.total_saved || 0).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}