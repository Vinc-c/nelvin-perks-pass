import React from "react";
import { motion } from "framer-motion";

export default function SectionCard({ icon: Icon, title, action, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              {Icon && <Icon className="h-5 w-5 text-slate-400" />}
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </motion.div>
  );
}