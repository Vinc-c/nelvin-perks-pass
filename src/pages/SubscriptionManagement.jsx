import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { CreditCard, Smartphone, Download, Plus, Check, Crown, Calendar, Receipt } from "lucide-react";

const invoices = [
  { id: "INV-2026-009", date: "2026-09-01", amount: "$19.00", status: "Paid" },
  { id: "INV-2026-008", date: "2026-08-01", amount: "$19.00", status: "Paid" },
  { id: "INV-2026-007", date: "2026-07-01", amount: "$19.00", status: "Paid" },
  { id: "INV-2026-006", date: "2026-06-01", amount: "$19.00", status: "Paid" },
];

export default function SubscriptionManagement() {
  const [annual, setAnnual] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <PortalLayout title="Subscription Management" theme="light">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current plan */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg lg:col-span-1">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
          <Crown className="h-7 w-7" />
          <p className="mt-2 text-sm text-amber-50">Current plan</p>
          <h2 className="text-2xl font-bold">Pass Premium</h2>
          <p className="mt-1 text-sm text-amber-50">Status: <span className="font-semibold">Active</span></p>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-50">
            <Calendar className="h-4 w-4" /> Renews on Oct 1, 2026
          </div>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-3xl font-extrabold">$19</span>
            <span className="mb-1 text-amber-50">/mo</span>
          </div>
        </motion.div>

        {/* Billing toggle + actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Billing cycle</h3>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => setAnnual(false)} className={`rounded-full px-5 py-2 text-sm font-medium ${!annual ? "bg-emerald-500 text-white" : "text-slate-600"}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`rounded-full px-5 py-2 text-sm font-medium ${annual ? "bg-emerald-500 text-white" : "text-slate-600"}`}>Annual <span className="text-xs">-15%</span></button>
          </div>
          <p className="mt-3 text-sm text-slate-500">{annual ? "Annual billing saves you 15% — you'll be charged $193/year." : "You're billed $19 every month. Switch to annual to save 15%."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">Change plan</button>
            <button className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel subscription</button>
          </div>
        </motion.div>
      </div>

      {/* Payment methods */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Payment methods</h3>
          <button onClick={() => setAdded(true)} className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Add method</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><CreditCard className="h-5 w-5" /></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Visa ending 4242</p>
              <p className="text-xs text-slate-500">Expires 08/27 · Default</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Smartphone className="h-5 w-5" /></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">MTN Mobile Money</p>
              <p className="text-xs text-slate-500">+237 6 90 ••• ••••</p>
            </div>
          </div>
        </div>
        {added && <p className="mt-3 flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Payment method added.</p>}
      </motion.div>

      {/* Invoices */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Receipt className="h-5 w-5 text-emerald-600" /> Tax invoices</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50">
                  <td className="py-3 font-mono text-slate-900">{inv.id}</td>
                  <td className="py-3 text-slate-500">{inv.date}</td>
                  <td className="py-3 font-medium text-slate-900">{inv.amount}</td>
                  <td className="py-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{inv.status}</span></td>
                  <td className="py-3 text-right"><button className="inline-flex items-center gap-1 text-emerald-600 hover:underline"><Download className="h-4 w-4" /> PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PortalLayout>
  );
}