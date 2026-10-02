import React from "react";
import { Quote, Star } from "lucide-react";

const reviews = [
  { name: "Amara D.", role: "Lagos, Nigeria", saved: "Saved $1,240", text: "Nelvin paid for itself in the first month. Brunch and spa every weekend at half the price!" },
  { name: "Kwame M.", role: "Accra, Ghana", saved: "Saved $780", text: "Offline QR codes are a lifesaver when I travel upcountry. Redemption always works." },
  { name: "Fatima Z.", role: "Cairo, Egypt", saved: "Saved $1,300", text: "Hotels Buy 1 Get 1 Free changed how my family holidays. Incredible value across MENA." },
  { name: "John M.", role: "Nairobi, Kenya", saved: "Saved $960", text: "Fitness passes pay back instantly. I train five days a week for the price of one." },
  { name: "Aisha B.", role: "Abuja, Nigeria", saved: "Saved $1,500", text: "Theme park days with the kids every month — they think I'm the best parent ever." },
  { name: "Youssef E.", role: "Marrakech, Morocco", saved: "Saved $2,100", text: "Spa & wellness deals are unreal. I treat myself weekly without touching my salary." },
  { name: "Grace O.", role: "Kigali, Rwanda", saved: "Saved $640", text: "Dining deals everywhere in the city. Date nights are back on the table." },
  { name: "Omar S.", role: "Tunis, Tunisia", saved: "Saved $1,100", text: "Travel stays half price meant a real summer holiday this year. Thank you Nelvin." },
  { name: "Naledi P.", role: "Cape Town, South Africa", saved: "Saved $1,820", text: "Shopping & retail discounts stack with sales. My wardrobe says thank you." },
  { name: "Tunde A.", role: "Douala, Cameroon", saved: "Saved $540", text: "Mobile money payouts land instantly. Cashback I can actually use the same day." },
  { name: "Leila H.", role: "Casablanca, Morocco", saved: "Saved $1,750", text: "Tech bazaar discounts got me a new laptop for less than I budgeted. Amazing." },
  { name: "Samba K.", role: "Dakar, Senegal", saved: "Saved $720", text: "Family fun park passes turned weekends into adventures. The kids are thrilled." },
  { name: "Zainab M.", role: "Accra, Ghana", saved: "Saved $1,340", text: "Beauty lounge deals make self-care affordable. I glow without going broke." },
  { name: "Daniel T.", role: "Addis Ababa, Ethiopia", saved: "Saved $980", text: "Home & living offers furnished my new apartment for a fraction of the cost." },
  { name: "Mariam F.", role: "Nairobi, Kenya", saved: "Saved $2,300", text: "Cinema & entertainment Buy 1 Get 1 — date night twice a week now. Love it!" },
];

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("");
}

function Card({ r }) {
  return (
    <div className="relative w-72 flex-shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <Quote className="absolute right-3 top-3 h-5 w-5 text-blue-100" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
          {initials(r.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{r.name}</p>
          <p className="truncate text-xs text-slate-500">{r.role}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
        </div>
        <span className="text-xs font-semibold text-blue-600">{r.saved}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{r.text}</p>
    </div>
  );
}

export default function Testimonials() {
  const loop = [...reviews, ...reviews];
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">What members say.</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          Real savings from 15 members across Africa & MENA. All amounts in USD.
        </p>
      </div>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        <div className="flex w-max animate-marquee gap-4 px-2">
          {loop.map((r, i) => <Card key={i} r={r} />)}
        </div>
      </div>
    </section>
  );
}