import React from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  { q: "What is Nelvin?", a: "Nelvin is a perks and benefits membership for African cities: premium perks, discounts and cashback at verified restaurants, hotels, spas, gyms and more. You can join on your own, or through your employer's Nelvin programme." },
  { q: "How do the Nelvin offers work?", a: "Pick an offer in the app and redeem it at the till: either the partner scans your personal code, valid for 3 minutes, or the cashier types their PIN on your phone. The discount applies to the real bill and any cashback lands in your wallet straight away." },
  { q: "How do I create an account?", a: "Sign up with your email, choose a membership and start redeeming. Nelvin opens in your phone's browser and installs on your home screen in one tap, with no app store needed. Employees can also join with their company's invitation code." },
  { q: "How do I pay for my membership?", a: "By Mobile Money, card, bank transfer or with your Nelvin wallet balance. Prices are shown in your local currency, including FCFA, naira, cedi and shilling." },
  { q: "I own a business. How do I join?", a: "Send a partner application with your offer and your shop's location. The Nelvin team verifies your business, then your offers go live in the app and on the partner map." },
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