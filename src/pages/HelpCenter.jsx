import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Search, LifeBuoy, Send, BookOpen, Wrench, Check } from "lucide-react";

const faqs = [
  { q: "How do I redeem an offer?", a: "Open any offer, tap Redeem, and show the generated QR code or 6-digit code to the merchant. Codes are valid for 3 minutes and work offline." },
  { q: "When is my cashback credited?", a: "Cashback is credited to your Nelvin wallet within 24 hours of a successful redemption. VIP members receive priority crediting." },
  { q: "Can I use my membership in another country?", a: "Yes. Pass Premium and VIP unlock offers across all partner cities in Africa. Your wallet converts automatically to local currency." },
  { q: "How do I withdraw my wallet balance?", a: "Go to your wallet and tap Withdraw to transfer to Mobile Money or a local bank account. Withdrawals are usually instant." },
  { q: "What happens if a code expires?", a: "Simply tap Redeem again to generate a fresh code. No rewards are lost when a code expires before use." },
];

const guides = [
  { title: "Getting started with Nelvin", desc: "Set up your wallet, choose a pass and redeem your first offer.", icon: BookOpen },
  { title: "Offline redemption troubleshooting", desc: "Fix common issues when redeeming without internet.", icon: Wrench },
  { title: "Managing your wallet & currency", desc: "Recharge, convert and withdraw across currencies.", icon: LifeBuoy },
];

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const filtered = faqs.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <PortalLayout title="Help Center" theme="light">
      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">How can we help?</h1>
        <p className="mt-1 text-sm text-blue-50">Search FAQs, browse guides, or contact our team.</p>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for help..." className="w-full rounded-full border-0 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none" />
        </div>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            {filtered.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-slate-100">
                <AccordionTrigger className="text-left text-sm font-medium text-slate-900 hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filtered.length === 0 && <p className="mt-4 text-sm text-slate-500">No FAQs match your search.</p>}
        </motion.div>

        {/* Guides */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Troubleshooting guides</h2>
            <div className="mt-4 space-y-3">
              {guides.map((g) => {
                const Icon = g.icon;
                return (
                  <button key={g.title} className="not-pill flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{g.title}</p>
                      <p className="text-xs text-slate-500">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact form */}
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><LifeBuoy className="h-5 w-5 text-emerald-600" /> Contact support</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        </div>
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" rows={4} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        <button type="submit" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
          <Send className="h-4 w-4" /> Send message
        </button>
        {sent && <p className="mt-3 flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Message sent — we'll reply within 24h.</p>}
      </motion.form>
    </PortalLayout>
  );
}