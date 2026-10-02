import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { mockMerchants } from "@/data/mockData";
import { DollarSign, Users, TrendingUp, Wallet, Award } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";

const monthly = [
  { month: "Apr", savings: 4200, spend: 12000, adoption: 45 },
  { month: "May", savings: 5100, spend: 14200, adoption: 52 },
  { month: "Jun", savings: 6300, spend: 16800, adoption: 61 },
  { month: "Jul", savings: 7400, spend: 19300, adoption: 68 },
  { month: "Aug", savings: 8900, spend: 22100, adoption: 74 },
  { month: "Sep", savings: 10200, spend: 24800, adoption: 82 },
];

const categorySpend = [
  { name: "Dining", value: 8200, color: "#10B981" },
  { name: "Wellness", value: 5400, color: "#3B82F6" },
  { name: "Hotels", value: 4200, color: "#8B5CF6" },
  { name: "Fitness", value: 3100, color: "#F59E0B" },
  { name: "Shopping", value: 3900, color: "#EC4899" },
];

export default function AnalyticsOverview() {
  const [range, setRange] = useState("6m");
  const stats = [
    { icon: DollarSign, label: "Total savings", value: "$42,100", delta: "+18%", color: "emerald" },
    { icon: Users, label: "Active members", value: "1,284", delta: "+12%", color: "blue" },
    { icon: TrendingUp, label: "Adoption rate", value: "82%", delta: "+8pts", color: "amber" },
    { icon: Wallet, label: "Avg spend / member", value: "$193", delta: "+5%", color: "rose" },
  ];
  const topMerchants = [...mockMerchants].sort((a, b) => b.payout_balance - a.payout_balance).slice(0, 5);
  const maxPayout = Math.max(...topMerchants.map((m) => m.payout_balance));

  return (
    <PortalLayout title="Analytics Overview" theme="light">
      <div className="flex items-center gap-2">
        {["1m", "3m", "6m", "1y"].map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${range === r ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {r === "1m" ? "This month" : r === "3m" ? "3 months" : r === "6m" ? "6 months" : "1 year"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-50`}><Icon className={`h-5 w-5 text-${s.color}-600`} /></div>
                <span className="text-xs font-semibold text-emerald-600">{s.delta}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Savings vs Spend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="savG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="spend" stroke="#3B82F6" fill="url(#spendG)" strokeWidth={2} />
                <Area type="monotone" dataKey="savings" stroke="#10B981" fill="url(#savG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Spend by category</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySpend} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {categorySpend.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Platform adoption rate</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="adoption" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Award className="h-5 w-5 text-amber-500" /> Top merchants</h3>
          <div className="mt-4 space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{i + 1}. {m.name}</span>
                  <span className="text-slate-500">${m.payout_balance.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${(m.payout_balance / maxPayout) * 100}%` }} viewport={{ once: true }} className="h-full rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
}