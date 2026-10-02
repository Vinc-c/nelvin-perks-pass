import React from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  { q: "What is Nelvin?", a: "Nelvin is a perks & benefits membership giving you Buy 1 Get 1 Free offers at 1,900+ brands across Africa & MENA — dining, hotels, spa, fitness, activities and more." },
  { q: "How do the Nelvin offers work?", a: "Browse offers in the app, tap to redeem, and scan the dynamic QR code (or use the offline code) at the merchant. You instantly get the second item free or the cashback credited to your wallet." },
  { q: "How do I create an account?", a: "Download the app, sign up with your email or phone, choose a membership, and start redeeming right away. Corporate employees can also join via their company's Nelvin program." },
  { q: "Can I use offers offline?", a: "Yes. Every redemption generates a 3-minute dynamic QR with an offline TOTP fallback, so you can redeem even without an internet connection." },
];

export default function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Questions, answered.</h2>
          <p className="mt-3 text-slate-500">The ones people actually ask before they join.</p>
          <Link to="/help-center" className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
            View all FAQs
          </Link>
        </div>
        <div className="lg:col-span-3">
          <Accordion type="single" collapsible defaultValue="item-0" className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="px-4">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900">{f.q}</AccordionTrigger>
                <AccordionContent className="text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}