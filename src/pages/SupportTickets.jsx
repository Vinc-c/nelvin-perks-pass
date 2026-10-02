import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Plus, Search, Clock, CheckCircle, AlertCircle, MessageSquare, Send, Filter } from "lucide-react";

const initialTickets = [
  { id: "TK-1042", subject: "Cashback not credited after redemption", category: "Payments", status: "open", priority: "high", date: "2026-10-01", replies: 2, history: ["Created", "Agent assigned", "Awaiting merchant info"] },
  { id: "TK-1039", subject: "Cannot upload KYC document", category: "Verification", status: "in_progress", priority: "medium", date: "2026-09-29", replies: 1, history: ["Created", "Escalated to KYC team"] },
  { id: "TK-1031", subject: "How to change wallet currency?", category: "Account", status: "resolved", priority: "low", date: "2026-09-25", replies: 3, history: ["Created", "Resolved", "Closed"] },
  { id: "TK-1020", subject: "Duplicate charge on subscription", category: "Payments", status: "resolved", priority: "high", date: "2026-09-18", replies: 4, history: ["Created", "Refund issued", "Closed"] },
];

const statusStyle = {
  open: { badge: "bg-rose-100 text-rose-700", icon: AlertCircle, label: "Open" },
  in_progress: { badge: "bg-amber-100 text-amber-700", icon: Clock, label: "In progress" },
  resolved: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: "Resolved" },
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = tickets
    .filter((t) => (filter === "all" ? true : t.status === filter))
    .filter((t) => t.subject.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase()));

  const counts = { open: tickets.filter((t) => t.status === "open").length, in_progress: tickets.filter((t) => t.status === "in_progress").length, resolved: tickets.filter((t) => t.status === "resolved").length };

  const submit = () => {
    if (!subject.trim()) return;
    const id = `TK-${1043 + tickets.length}`;
    setTickets((p) => [{ id, subject, category: "General", status: "open", priority: "medium", date: "2026-10-02", replies: 0, history: ["Created"] }, ...p]);
    setSubject(""); setMessage("");
  };

  return (
    <PortalLayout title="Support Tickets" theme="light">
      {/* Pipeline */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(counts).map(([k, v], i) => {
          const s = statusStyle[k];
          const Icon = s.icon;
          return (
            <motion.div key={k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.badge}`}><Icon className="h-5 w-5" /></span>
                <span className="text-3xl font-bold text-slate-900">{v}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{s.label} tickets</p>
            </motion.div>
          );
        })}
      </div>

      {/* New ticket */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Plus className="h-5 w-5 text-emerald-600" /> Open a new ticket</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
        <button onClick={submit} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"><Send className="h-4 w-4" /> Submit ticket</button>
      </motion.div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", "open", "in_progress", "resolved"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${filter === f ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              {f === "in_progress" ? "In progress" : f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {filtered.map((t, i) => {
          const s = statusStyle[t.status];
          const Icon = s.icon;
          return (
            <motion.button key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => setSelected(selected === t.id ? null : t.id)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{t.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">{t.id} · {t.category} · {t.date}</p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}><Icon className="h-3 w-3" /> {s.label}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {t.replies} replies</span>
                <span className={`rounded-full px-2 py-0.5 ${t.priority === "high" ? "bg-rose-100 text-rose-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{t.priority} priority</span>
              </div>
              {selected === t.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Resolution timeline</p>
                  <ol className="space-y-1.5">
                    {t.history.map((h, hi) => (
                      <li key={hi} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">{hi + 1}</span> {h}
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </motion.button>
          );
        })}
        {filtered.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><Filter className="mx-auto mb-2 h-5 w-5 text-slate-300" /> No tickets match your filters.</p>}
      </div>
    </PortalLayout>
  );
}