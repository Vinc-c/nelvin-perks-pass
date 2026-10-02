import React from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Award, Crown, Star, ThumbsUp, Trophy, Gift, Sparkles } from "lucide-react";

const badges = [
  { id: "b1", name: "Foodie Explorer", desc: "10 dining redemptions", icon: Star, color: "emerald", earned: "2026-09-28" },
  { id: "b2", name: "Wellness Pro", desc: "5 spa & wellness visits", icon: Award, color: "blue", earned: "2026-09-20" },
  { id: "b3", name: "Fitness Streak", desc: "30-day gym streak", icon: Trophy, color: "amber", earned: "2026-09-10" },
  { id: "b4", name: "Top Saver", desc: "Saved over $500", icon: Crown, color: "amber", earned: "2026-08-30" },
  { id: "b5", name: "Team Player", desc: "Sent 20 peer recognitions", icon: ThumbsUp, color: "emerald", earned: "2026-08-15" },
  { id: "b6", name: "VIP Member", desc: "Upgraded to VIP Gold pass", icon: Sparkles, color: "amber", earned: "2026-07-01" },
];

const rewards = [
  { id: "r1", title: "$10 bonus cashback", from: "Monthly VIP perk", date: "2026-10-01", icon: Gift },
  { id: "r2", title: "Peer praise from Fatima Zahra", from: '"Great collaboration on the Q3 launch!"', date: "2026-09-27", icon: ThumbsUp },
  { id: "r3", title: "50 recognition points", from: "Engineering team reward", date: "2026-09-22", icon: Star },
  { id: "r4", title: "Free coffee voucher", from: "Lagos Fitness Hub partner", date: "2026-09-18", icon: Gift },
  { id: "r5", title: "Peer praise from John Mwangi", from: '"Always reliable and helpful!"', date: "2026-09-12", icon: ThumbsUp },
];

export default function RewardHistory() {
  return (
    <PortalLayout title="Reward History" theme="light">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Trophy, label: "Badges earned", value: "6", color: "amber" },
          { icon: Star, label: "Recognition points", value: "420", color: "emerald" },
          { icon: ThumbsUp, label: "Praise received", value: "12", color: "blue" },
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
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Badges */}
      <h2 className="mt-8 font-semibold text-slate-900">Collected badges</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${b.color}-50`}>
                <Icon className={`h-6 w-6 text-${b.color}-600`} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">{b.desc}</p>
                <p className="mt-0.5 text-xs text-slate-400">Earned {b.earned}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rewards timeline */}
      <h2 className="mt-8 font-semibold text-slate-900">Past rewards & recognition</h2>
      <div className="mt-4 space-y-3">
        {rewards.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Icon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{r.title}</p>
                <p className="text-sm text-slate-500">{r.from}</p>
              </div>
              <span className="text-xs text-slate-400">{r.date}</span>
            </motion.div>
          );
        })}
      </div>
    </PortalLayout>
  );
}