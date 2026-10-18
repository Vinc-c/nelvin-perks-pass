import React from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  { q: "What is Nelvin?", a: "Nelvin is a savings membership for African cities. You get offers and cashback at verified restaurants, hotels, spas, gyms and shops. You can join on your own or through your employer." },
  { q: "How do the Nelvin offers work?", a: "Pick an offer in the app and show it at the till. The partner scans your personal code, which is valid for 3 minutes, or the cashier enters their PIN on your phone. The offer applies to your real bill, and any cashback goes to your wallet right away." },
  { q: "How do I create an account?", a: "Sign up with your email, choose a membership and start saving. Nelvin opens in your phone's browser and adds to your home screen in one tap. Employees can also join with their company's invitation code." },
  { q: "How do I pay for my membership?", a: "You can pay by Mobile Money, card, bank transfer or with your Nelvin wallet. Prices show in your local currency, such as FCFA, naira, cedi or shilling." },
  { q: "I own a business. How do I join?", a: "Send us a partner application with your offer and your shop's location. Our team checks your business, then your offers go live in the app and on the partner map." },
];

export default function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-nv-ink sm:text-4xl">Questions, answered.</h2>
          <p className="mt-3 text-nv-muted">The ones people actually ask before they join.</p>
          <Link to="/help-center" className="mt-6 inline-flex items-center justify-center rounded-full border border-nv-line bg-white px-7 py-3 font-semibold text-nv-ink transition hover:bg-nv-ivory-2">
            View all FAQs
          </Link>
        </div>
        <div className="lg:col-span-3">
          <Accordion type="single" collapsible defaultValue="item-0" className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-nv-line">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="px-4">
                <AccordionTrigger className="text-left text-base font-semibold text-nv-ink">{f.q}</AccordionTrigger>
                <AccordionContent className="text-nv-muted">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}