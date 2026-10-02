import React from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Award, Crown, Star, ThumbsUp, Trophy, Gift, Sparkles, Lock, Flame } from "lucide-react";

const badges = [
  { id: "b1", name: "Foodie Explorer", desc: "10 dining redemptions", icon: Star, color: "emerald", earned: true, date: "2026-09-28" },
  { id: "b2", name: "Wellness Pro", desc: "5 spa & wellness visits", icon: Award, color: "blue", earned: true, date: "2026-09-20" },
  { id: "b3", name: "Fitness Streak", desc: "30-day gym streak", icon: Trophy, color: "amber", earned: true, date: "2026-09-10" },
  { id: "b4", name: "Top Saver", desc: "Saved over $500", icon: Crown, color: "amber", earned: true, date: "2026-08-30" },
  { id: "b5", name: "Globe Trotter", desc: "Redeem in 3 countries", icon: Gift, color: "rose", earned: false, progress: 67 },
  { id: "b6", name: "VIP Insider", desc: "Reach VIP Gold tier", icon: Sparkles, color: "amber", earned: false, progress: 40 },
];

const milestones = [
  { title: "First redemption", reward: "50 pts", done: true },
  { title: "10 redemptions", reward: "200 pts", done: true },
  { title: "Save $250 total", reward: "Free coffee voucher", done: true },
  { title: "Save $500 total", reward: "$10 cashback bonus", done: true },
  { title: "Invite 5 friends", reward: "1 month Premium free", done: false, progress: 80 },
  { title: "Unlock VIP Gold", reward: "Concierge access", done: false, progress: 40 },
];

export default function MyRewards() {
  return (
    <PortalLayout title="My Rewards" theme="light">
      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-amber-50"><Crown className="h-4 w-4" /> Recognition points</p>
            <p className="mt-2 text-4xl font-extrabold">420 pts</p>
            <p className="mt-1 text-sm text-amber-50">4 badges unlocked · Next tier: 500 pts</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-amber-50"><span>420</span><span>500</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/25">
              <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <h2 className="mt-8 flex items-center gap-2 font-semibold text-slate-900"><Award className="h-5 w-5 text-amber-500" /> Earned badges</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className={`relative flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${b.earned ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50"}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${b.earned ? `bg-${b.color}-50` : "bg-slate-200"}`}>
                {b.earned ? <Icon className={`h-6 w-6 text-${b.color}-600`} /> : <Lock className="h-5 w-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">{b.desc}</p>
                {b.earned ? (
                  <p className="mt-1 text-xs text-emerald-600">Unlocked {b.date}</p>
                ) : (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-500" style={{ width: `${b.progress}%` }} /></div>
                    <p className="mt-1 text-xs text-slate-400">{b.progress}% complete</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Milestones */}
      <h2 className="mt-8 flex items-center gap-2 font-semibold text-slate-900"><Flame className="h-5 w-5 text-rose-500" /> Achievement milestones</h2>
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={m.title} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${m.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                  {m.done ? <ThumbsUp className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.title}</p>
                  <p className="text-xs text-slate-500">Reward: {m.reward}</p>
                </div>
              </div>
              {m.done ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Completed</span>
              ) : (
                <div className="w-24">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-500" style={{ width: `${m.progress}%` }} /></div>
                  <p className="mt-1 text-right text-[11px] text-slate-400">{m.progress}%</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </PortalLayout>
  );
}