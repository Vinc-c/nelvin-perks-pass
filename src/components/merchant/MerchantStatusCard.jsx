import React from "react";
import { motion } from "framer-motion";

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function MerchantStatusCard({ icon: Icon, tone, title, text, cta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10"
    >
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
      {cta && (
        <a href={cta.href} className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
          {cta.label}
        </a>
      )}
    </motion.div>
  );
}