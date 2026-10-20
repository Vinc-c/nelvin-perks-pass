import React from "react";
import { motion } from "framer-motion";
import NvIcon from "@/components/brand/NvIcon";

const STEPS = [
  { glyph: "PASS_FREE", title: "Join in a minute", text: "Create your account with your email or phone. Browse the offers for free, upgrade when you want the premium perks." },
  { glyph: "PERK_GIFT", title: "Pick a member offer", text: "Choose your city and a category: a free dessert, a room upgrade, a spa extra, a percentage off the bill." },
  { glyph: "CASHBACK", title: "Show your code, save", text: "Give the partner your one-time code or let them type their PIN. The saving is applied to the bill and tracked in your wallet." },
];

/** Landing: the three-step journey, in plain words. */
export default function HowItWorks() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
      <p className="text-center text-sm font-semibold text-nv-bronze">How it works</p>
      <h2 className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold text-nv-ink sm:text-4xl">From sign-up to saving in three steps.</h2>
      <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
        <div className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[repeating-linear-gradient(90deg,#C8A24A_0_8px,transparent_8px_16px)] md:block" aria-hidden="true" />
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative text-center"
          >
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-nv-emerald shadow-lg shadow-nv-deep/10 ring-1 ring-nv-line">
              <NvIcon name={s.glyph} className="h-9 w-9" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-nv-deep text-xs font-bold text-nv-gold-light">{i + 1}</span>
            </span>
            <h3 className="mt-5 text-lg font-bold text-nv-ink">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-nv-muted">{s.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
