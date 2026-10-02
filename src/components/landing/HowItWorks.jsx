import React from "react";
import { motion } from "framer-motion";
import { Smartphone, CreditCard, QrCode } from "lucide-react";

const steps = [
  { n: 1, icon: Smartphone, title: "Download app", desc: "Get the Nelvin app on iOS or Android in seconds." },
  { n: 2, icon: CreditCard, title: "Choose membership", desc: "Pick the Africa or MENA pass that fits your lifestyle." },
  { n: 3, icon: QrCode, title: "Start redeeming", desc: "Scan & save with Buy 1 Get 1 Free at 1,900+ brands." },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">How does it work?</h2>
      <div className="relative mt-14">
        {/* connecting line */}
        <div className="absolute left-0 right-0 top-7 hidden h-0.5 bg-slate-200 sm:block" />
        <div className="relative grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-8 ring-white">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-lg font-bold text-slate-900">{s.title}</p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="mt-12 text-center">
        <a href="#app-download" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700">
          Get the app
        </a>
      </div>
    </section>
  );
}