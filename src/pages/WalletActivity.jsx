import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { mockTransactions, mockCurrencies } from "@/data/mockData";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Filter, Search, Receipt } from "lucide-react";

export default function WalletActivity() {
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [curCode, setCurCode] = useState("USD");

  const cur = mockCurrencies.find((c) => c.code === curCode);

  const txs = useMemo(() => {
    return mockTransactions
      .filter((t) => (filter === "ALL" ? true : t.type === filter))
      .filter((t) => t.merchant_name.toLowerCase().includes(query.toLowerCase()));
  }, [filter, query]);

  const totalSpent = mockTransactions.filter((t) => t.type === "REDEMPTION").reduce((s, t) => s + t.amount, 0);
  const totalCashback = mockTransactions.reduce((s, t) => s + t.cashback_amount, 0);
  const totalRecharged = mockTransactions.filter((t) => t.type === "RECHARGE").reduce((s, t) => s + t.amount, 0);

  const fmt = (n) => `${cur.symbol}${(n * cur.rate).toFixed(2)}`;

  return (
    <PortalLayout title="Wallet Activity" theme="light">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Receipt, label: "Total spent", value: totalSpent, color: "rose" },
          { icon: TrendingUp, label: "Total cashback", value: totalCashback, color: "emerald" },
          { icon: ArrowDownLeft, label: "Total recharged", value: totalRecharged, color: "blue" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-50`}>
                <Icon className={`h-5 w-5 text-${s.color}-600`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{fmt(s.value)}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["ALL", "REDEMPTION", "RECHARGE", "WITHDRAWAL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search merchant"
              className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={curCode}
            onChange={(e) => setCurCode(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
          >
            {mockCurrencies.map((c) => <option key={c.code} value={c.code} className="bg-white">{c.code}</option>)}
          </select>
        </div>
      </div>

      {/* History */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Transaction history</h2>
          <span className="ml-auto text-xs text-slate-400">{txs.length} records</span>
        </div>
        <div className="divide-y divide-slate-100">
          {txs.map((tx) => {
            const isOut = tx.type === "WITHDRAWAL";
            const isIn = tx.type === "RECHARGE";
            return (
              <div key={tx.id} className="flex items-center justify-between px-5 py-4 transition hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isIn ? "bg-emerald-100" : isOut ? "bg-rose-100" : "bg-slate-100"}`}>
                    {isIn ? <ArrowDownLeft className="h-5 w-5 text-emerald-600" /> : isOut ? <ArrowUpRight className="h-5 w-5 text-rose-600" /> : <Wallet className="h-5 w-5 text-slate-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tx.merchant_name}</p>
                    <p className="text-xs text-slate-500">{tx.date} · {tx.type} · {tx.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isOut ? "text-rose-600" : "text-slate-900"}`}>
                    {isOut ? "-" : isIn ? "+" : ""}{fmt(tx.amount)}
                  </p>
                  {tx.cashback_amount > 0 && <p className="text-xs text-emerald-600">+{fmt(tx.cashback_amount)} cashback</p>}
                </div>
              </div>
            );
          })}
          {txs.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No transactions match your filters.</p>}
        </div>
      </div>
    </PortalLayout>
  );
}