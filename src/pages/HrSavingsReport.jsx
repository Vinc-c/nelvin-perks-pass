import React, { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { mockEmployees } from "@/data/mockData";
import { DollarSign, TrendingUp, Users, Activity, Download, Calendar } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const monthlySavings = [
  { month: "Apr", savings: 1200, usage: 45 },
  { month: "May", savings: 1800, usage: 52 },
  { month: "Jun", savings: 2400, usage: 61 },
  { month: "Jul", savings: 3100, usage: 68 },
  { month: "Aug", savings: 3900, usage: 74 },
  { month: "Sep", savings: 4600, usage: 82 },
];

const deptUsage = [
  { dept: "Engineering", usage: 88 },
  { dept: "Sales", usage: 72 },
  { dept: "Marketing", usage: 79 },
  { dept: "Operations", usage: 64 },
  { dept: "HR", usage: 91 },
];

const allowanceSplit = [
  { name: "Dining", value: 42, color: "#10B981" },
  { name: "Health", value: 35, color: "#3B82F6" },
  { name: "Sport", value: 23, color: "#F59E0B" },
];

export default function HrSavingsReport() {
  const [range, setRange] = useState("6m");

  return (
    <PortalLayout title="HR Savings Report" theme="light">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Savings & Engagement Analytics</h1>
          <p className="text-sm text-slate-500">Visualize total team savings, allowance usage, and engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 p-0.5">
            {["3m", "6m", "1y"].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${range === r ? "bg-emerald-500 text-white" : "text-slate-500"}`}>
                <Calendar className="h-3 w-3" /> {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: DollarSign, label: "Total team savings", value: "$16,800", trend: "+18%", color: "emerald" },
          { icon: Activity, label: "Allowance usage", value: "82%", trend: "+7%", color: "amber" },
          { icon: TrendingUp, label: "Engagement score", value: "8.4/10", trend: "+0.6", color: "blue" },
          { icon: Users, label: "Active employees", value: "105/128", trend: "+12", color: "rose" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-50`}>
                <Icon className={`h-5 w-5 text-${s.color}-600`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">{s.label}</p>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600">{s.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Total savings over time ($)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySavings}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="savings" stroke="#10B981" fill="url(#savingsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Allowance usage rate (%)</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySavings}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="usage" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Usage by department</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptUsage} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="dept" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="usage" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Allowance split</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allowanceSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {allowanceSplit.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-employee table */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Per-employee savings</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Used</th>
                <th className="pb-3 font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {mockEmployees.map((e) => {
                const used = e.allowances.dining + e.allowances.health + e.allowances.sport;
                const saved = Math.round(used * 0.22);
                return (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-900">{e.full_name}</td>
                    <td className="py-3 text-slate-600">{e.department}</td>
                    <td className="py-3 text-slate-600">${used}</td>
                    <td className="py-3 font-semibold text-emerald-600">${saved}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
}