import React from "react";
import { motion } from "framer-motion";
import { BrandIcon } from "@/components/brand/NvIcon";

const TONES = {
  emerald: { chip: "bg-emerald-50", text: "text-emerald-600" },
  amber: { chip: "bg-amber-50", text: "text-amber-600" },
  blue: { chip: "bg-blue-50", text: "text-blue-600" },
  rose: { chip: "bg-rose-50", text: "text-rose-600" },
  purple: { chip: "bg-purple-50", text: "text-purple-600" },
};

export default function StatCard({ icon: Icon, label, value, tone = "emerald", delay = 0, hint }) {
  const t = TONES[tone] || TONES.emerald;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}`}>
        <BrandIcon icon={Icon} className={`h-5 w-5 ${t.text}`} glyphClassName={`h-6 w-6 ${t.text}`} />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  );
}