import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { mockCurrencies } from "@/data/mockData";
import { ArrowRightLeft, Wallet, Globe, TrendingUp } from "lucide-react";

export default function CurrencyExchange() {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("XAF");

  const fromCur = mockCurrencies.find((c) => c.code === from);
  const toCur = mockCurrencies.find((c) => c.code === to);

  const converted = useMemo(() => (amount / fromCur.rate) * toCur.rate, [amount, fromCur, toCur]);
  const walletBalance = 247.5;
  const homeBalance = useMemo(() => (walletBalance / mockCurrencies.find((c) => c.code === "USD").rate) * toCur.rate, [to]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <PortalLayout title="Currency Exchange" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Currency Exchange</h1>
        <p className="text-sm text-slate-500">Live conversion rates for supported currencies across Africa & MENA.</p>
      </div>

      {/* Converter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <label className="block text-sm">
            <span className="text-slate-500">From</span>
            <div className="mt-1 flex gap-2">
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none">
                {mockCurrencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </label>
          <button onClick={swap} className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-emerald-600 transition hover:bg-slate-100">
            <ArrowRightLeft className="h-5 w-5" />
          </button>
          <label className="block text-sm">
            <span className="text-slate-500">To</span>
            <div className="mt-1 flex gap-2">
              <input value={converted.toFixed(2)} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-emerald-600 outline-none" />
              <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none">
                {mockCurrencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </label>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          1 {fromCur.code} = <span className="font-semibold text-slate-900">{(toCur.rate / fromCur.rate).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> {toCur.code}
        </p>
      </motion.div>

      {/* Wallet balance */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-slate-500"><Wallet className="h-4 w-4 text-emerald-600" /> Wallet balance (home)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">$247.50 <span className="text-base font-normal text-slate-400">USD</span></p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="flex items-center gap-2 text-sm text-emerald-700"><Globe className="h-4 w-4" /> In {toCur.name}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{toCur.symbol}{homeBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base font-normal text-emerald-600/70">{toCur.code}</span></p>
        </div>
      </div>

      {/* Rate table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <h3 className="font-semibold text-slate-900">Current rates (per USD)</h3>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {mockCurrencies.map((c) => (
            <div key={c.code} className="bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{c.code}</span>
                <span className="text-xs text-slate-400">{c.symbol}</span>
              </div>
              <p className="mt-1 font-mono text-lg text-emerald-600">{c.rate.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{c.name}</p>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}