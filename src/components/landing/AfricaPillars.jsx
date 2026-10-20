import React from "react";
import { motion } from "framer-motion";
import NvIcon from "@/components/brand/NvIcon";

const PILLARS = [
  { glyph: "MOBILE_MONEY", title: "Pay the way you already do", text: "Mobile Money, card or bank transfer, in your own currency. Prices shown in USD are converted at checkout." },
  { glyph: "PIN_CODE", title: "No scanner needed at the till", text: "Show a one-time code, or let the partner type their PIN on your phone. It works in a market stall as well as in a hotel." },
  { glyph: "OFFLINE", title: "Works on a weak connection", text: "The offers you last opened stay on your phone. A low-data mode keeps images light when the network is slow." },
  { glyph: "WHATSAPP", title: "Share in one tap", text: "Send an offer to a friend or the family group on WhatsApp, with the link already written." },
  { glyph: "CITY_PIN", title: "Your city comes first", text: "Pick Abidjan, Lagos, Nairobi or Douala once. Nelvin remembers it and shows what is near you." },
  { glyph: "VERIFIED", title: "Verified partners only", text: "Every partner is checked before going live, and your savings are computed by Nelvin, never typed in by hand." },
];

/** Landing: what makes Nelvin different from imported discount clubs. */
export default function AfricaPillars() {
  return (
    <section className="relative mt-24 overflow-hidden bg-nv-deep py-20 text-white">
      <NvIcon name="AFRICA" tone="dark" strokeWidth={0.18} className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-nv-gold" faint={0.1} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-semibold text-nv-gold-light">Built for Africa</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">A membership designed around how you live, pay and connect.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nv-gold/15 text-white ring-1 ring-nv-gold/30">
                <NvIcon name={p.glyph} tone="dark" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
