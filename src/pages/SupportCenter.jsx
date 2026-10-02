import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { LifeBuoy, Send, Clock, CheckCircle, AlertCircle, MessageSquare, Search } from "lucide-react";

const initialTickets = [
  { id: "tk-1042", subject: "Cashback not credited after redemption", category: "Payments", status: "open", priority: "high", date: "2026-10-01", replies: 2 },
  { id: "tk-1039", subject: "Cannot upload KYC document", category: "Verification", status: "in_progress", priority: "medium", date: "2026-09-29", replies: 1 },
  { id: "tk-1031", subject: "How to change wallet currency?", category: "Account", status: "resolved", priority: "low", date: "2026-09-25", replies: 3 },
];

const statusStyle = {
  open: "bg-rose-100 text-rose-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};
const statusIcon = { open: AlertCircle, in_progress: Clock, resolved: CheckCircle };

export default function SupportCenter() {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Payments");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const submit = () => {
    if (!subject.trim() || !message.trim()) return;
    setTickets((p) => [
      { id: `tk-${1043 + p.length}`, subject, category, status: "open", priority: "medium", date: "2026-10-02", replies: 0 },
      ...p,
    ]);
    setSubject(""); setMessage("");
  };

  const filtered = tickets.filter((t) => t.subject.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query));

  return (
    <PortalLayout title="Support Help Desk" theme="light">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* New ticket */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><LifeBuoy className="h-5 w-5 text-emerald-600" /> Submit a ticket</h3>
          <div className="mt-4 space-y-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
              {["Payments", "Verification", "Account", "Redemption", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue..." rows={4} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <button onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
              <Send className="h-4 w-4" /> Submit ticket
            </button>
          </div>
        </motion.div>

        {/* Ticket list */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((t, i) => {
              const Icon = statusIcon[t.status];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{t.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.id} · {t.category} · {t.date}</p>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[t.status]}`}>
                      <Icon className="h-3 w-3" /> {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {t.replies} replies</span>
                    <span className={`rounded-full px-2 py-0.5 ${t.priority === "high" ? "bg-rose-100 text-rose-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{t.priority} priority</span>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No tickets found.</p>}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}