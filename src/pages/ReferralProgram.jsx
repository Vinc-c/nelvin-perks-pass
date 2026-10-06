import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Copy, Check, Gift, Users, DollarSign, Share2, Sparkles, TrendingUp } from "lucide-react";

const tiers = [
  { invites: 1, reward: "$5", perk: "Cashback bonus" },
  { invites: 5, reward: "$25", perk: "1 month Premium free" },
  { invites: 10, reward: "$60", perk: "VIP event invite" },
  { invites: 25, reward: "$150", perk: "VIP Gold upgrade" },
];

const myReferrals = [
  { name: "Kwame Mensah", email: "kwame@example.com", status: "joined", date: "2026-09-28", reward: "$5" },
  { name: "Aisha Bello", email: "aisha@example.com", status: "joined", date: "2026-09-20", reward: "$5" },
  { name: "Omar Saleh", email: "omar@example.com", status: "pending", date: "2026-10-01", reward: "—" },
  { name: "Naledi P.", email: "naledi@example.com", status: "joined", date: "2026-09-10", reward: "$5" },
];

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false);
  const link = "https://nelvin.app/r/AMARA2026";

  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const stats = [
    { icon: Users, label: "People invited", value: "12", color: "blue" },
    { icon: Check, label: "Joined", value: "8", color: "emerald" },
    { icon: DollarSign, label: "Rewards earned", value: "$40", color: "amber" },
  ];

  return (
    <PortalLayout title="Referral Program" theme="light">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <Gift className="h-8 w-8" />
        <h1 className="mt-3 text-2xl font-bold">Invite friends, earn rewards</h1>
        <p className="mt-1 max-w-md text-sm text-emerald-50">Give $5, get $5. Earn bonuses as your network grows — all rewards credited to your wallet.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5">
            <span className="truncate font-mono text-sm">{link}</span>
          </div>
          <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"><Share2 className="h-4 w-4" /> Share</button>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm">Code: <strong>AMARA2026</strong></span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${s.color}-50`}><Icon className={`h-5 w-5 text-${s.color}-600`} /></div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Reward tiers */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="h-5 w-5 text-amber-500" /> Reward milestones</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div key={t.invites} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{t.invites} invites</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{t.reward}</p>
              <p className="mt-1 text-xs text-slate-600">{t.perk}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referrals list */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><TrendingUp className="h-5 w-5 text-emerald-600" /> Your referrals</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 font-medium">Friend</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Reward</th>
              </tr>
            </thead>
            <tbody>
              {myReferrals.map((r) => (
                <tr key={r.email} className="border-b border-slate-50">
                  <td className="py-3"><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.email}</p></td>
                  <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.status === "joined" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                  <td className="py-3 text-slate-500">{r.date}</td>
                  <td className="py-3 text-right font-semibold text-emerald-600">{r.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PortalLayout>
  );
}