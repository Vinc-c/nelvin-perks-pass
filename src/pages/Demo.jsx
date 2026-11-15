import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Check, ChevronLeft, ChevronRight, Gift, Pause, Play, QrCode, ShieldCheck, Smartphone, Store, Users, Star } from "lucide-react";
import SiteHeader from "@/components/landing/SiteHeader";
import NelvinLogo from "@/components/NelvinLogo";

/* ------------------------------------------------------------------ */
/* Demo data: everything here is fictional. Nothing is read or written. */
/* ------------------------------------------------------------------ */
const OFFERS = [
  { name: "Savanna Grill", title: "20% off at Savanna Grill", city: "Douala", tag: "Dining", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=60" },
  { name: "Glow Beauty Salon", title: "30% off at Glow Beauty Salon", city: "Buea", tag: "Beauty", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=60" },
  { name: "Atlas Fitness", title: "50% off at Atlas Fitness", city: "Kumba", tag: "Fitness", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=60" },
];

const ROLES = [
  {
    id: "member", label: "Member", icon: Smartphone, device: "phone",
    pitch: "A person saves money every day at local partners and earns cashback.",
    steps: [
      { screen: "m-home", title: "Open the app", why: "A personal home page: the best offers near the member, no clutter." },
      { screen: "m-offer", title: "Pick an offer", why: "Real discounts at partner shops, restaurants, salons, gyms." },
      { screen: "m-qr", title: "Show the code at the shop", why: "The partner validates it in 2 seconds. No coupons, no cards." },
      { screen: "m-wallet", title: "Cashback lands in the wallet", why: "Money back after every purchase. The member can spend it or withdraw it." },
      { screen: "m-rate", title: "Rate the partner", why: "Reviews keep partners honest. Nelvin approves each one before it is public." },
    ],
  },
  {
    id: "employee", label: "Employee", icon: Gift, device: "phone",
    pitch: "Employees receive benefits from their employer and spend them at partners.",
    steps: [
      { screen: "e-home", title: "Branded home", why: "The employee sees the company's own logo, colours and welcome message." },
      { screen: "e-allow", title: "Monthly allowances", why: "Meal, transport, wellness: the employer sets a budget per category." },
      { screen: "m-qr", title: "Spend at partners", why: "Same simple code as members. The allowance is used first." },
    ],
  },
  {
    id: "hr", label: "Company (HR)", icon: Building2, device: "laptop",
    pitch: "HR gives benefits to a whole team in minutes and sees the impact.",
    steps: [
      { screen: "h-dash", title: "See adoption and savings", why: "How many employees are active, how much they saved, which benefits work." },
      { screen: "h-benefits", title: "Set allowances", why: "Choose categories and monthly amounts. Employees get them automatically." },
      { screen: "h-brand", title: "Make it your own", why: "On Growth and Enterprise plans the dashboard uses the company's identity. Try the colours." },
    ],
  },
  {
    id: "partner", label: "Partner (shop)", icon: Store, device: "laptop",
    pitch: "Shops get new customers, pay nothing upfront and are paid for every sale.",
    steps: [
      { screen: "p-scan", title: "Validate a code", why: "Type or scan the customer's code. The discount is applied and recorded." },
      { screen: "p-stats", title: "See new customers", why: "Visits, revenue and ratings in one place." },
      { screen: "p-pay", title: "Get paid", why: "Earnings are tracked per sale and paid out to mobile money or bank." },
    ],
  },
  {
    id: "admin", label: "Platform team", icon: ShieldCheck, device: "laptop",
    pitch: "The Nelvin team keeps the marketplace safe, fair and growing.",
    steps: [
      { screen: "a-vet", title: "Vet every partner", why: "Documents are checked before a shop can publish offers." },
      { screen: "a-mod", title: "Moderate reviews and branding", why: "Reviews and company branding go live only after approval." },
    ],
  },
];

/* ------------------------------ UI bits ------------------------------ */
const money = (n) => `$${n.toFixed(2)}`;
const Card = ({ children, className = "" }) => <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>{children}</div>;
const Chip = ({ children, tone = "slate" }) => {
  const tones = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", gold: "bg-amber-50 text-amber-800" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
};
const Stars = ({ n = 5 }) => <span className="flex text-amber-400">{Array.from({ length: n }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</span>;

function PhoneFrame({ children }) {
  return (
    <div className="mx-auto w-[270px] rounded-[2.4rem] bg-[#1b1d22] p-2 shadow-2xl ring-1 ring-black/30 sm:w-[300px]">
      <div className="relative h-[540px] overflow-hidden rounded-[2rem] bg-white sm:h-[600px]">
        <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full overflow-hidden pt-8">{children}</div>
      </div>
    </div>
  );
}
function LaptopFrame({ children }) {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="rounded-t-2xl bg-[#1b1d22] p-2 pb-0 ring-1 ring-black/30">
        <div className="h-[330px] overflow-hidden rounded-t-lg bg-slate-50 sm:h-[360px]">{children}</div>
      </div>
      <div className="mx-auto h-3 rounded-b-xl bg-gradient-to-b from-slate-300 to-slate-400" />
    </div>
  );
}

/* --------------------------- Phone screens --------------------------- */
function MHome({ brand }) {
  return (
    <div className="px-4">
      {brand && (
        <div className="mb-3 rounded-2xl p-3 text-white" style={{ backgroundColor: brand.color }}>
          <p className="text-[10px] opacity-80">{brand.name}</p>
          <p className="text-sm font-medium">Welcome to your benefits</p>
        </div>
      )}
      <p className="text-[10px] text-slate-500">Good evening</p>
      <p className="text-2xl font-medium text-slate-900">Amina</p>
      <div className="-mx-4 mt-3 flex gap-2 overflow-hidden px-4">
        {OFFERS.map((o) => (
          <div key={o.name} className="relative h-32 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#0F4A38]">
            <img src={o.img} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute inset-x-1 bottom-1 text-[8px] font-medium leading-tight text-white">{o.title}</span>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-4 text-xs font-medium text-slate-900">Trending near you</p>
      {OFFERS.slice(0, 2).map((o) => (
        <Card key={o.name} className="mb-2 flex items-center gap-3 p-2">
          <img src={o.img} alt="" className="h-12 w-12 rounded-xl object-cover" />
          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-slate-900">{o.title}</p><p className="text-[10px] text-slate-500">{o.name} · {o.city}</p></div>
          <Chip tone="green">Redeem</Chip>
        </Card>
      ))}
    </div>
  );
}
function MOffer() {
  const o = OFFERS[0];
  return (
    <div>
      <img src={o.img} alt="" className="h-40 w-full object-cover" />
      <div className="p-4">
        <p className="text-base font-medium text-slate-900">{o.title}</p>
        <p className="text-[11px] text-slate-500">{o.name} · {o.city}</p>
        <div className="mt-2 flex items-center gap-1"><Stars /> <span className="text-[10px] text-slate-500">4.8 · 126 reviews</span></div>
        <p className="mt-3 text-[11px] text-slate-600">Show your code at the table before paying. Valid every day, once per visit.</p>
        <div className="mt-4 rounded-xl bg-[#0F4A38] py-3 text-center text-xs font-medium text-white">Redeem offer</div>
      </div>
    </div>
  );
}
function MQr() {
  return (
    <div className="flex h-full flex-col items-center px-6 pt-6 text-center">
      <p className="text-sm font-medium text-slate-900">Show this to the partner</p>
      <div className="mt-4 grid h-40 w-40 grid-cols-8 gap-0.5 rounded-xl border border-slate-200 p-2">
        {Array.from({ length: 64 }).map((_, i) => <span key={i} className={`${(i * 7 + (i >> 3) * 3) % 5 < 2 ? "bg-slate-900" : "bg-white"} rounded-[1px]`} />)}
      </div>
      <p className="mt-3 font-mono text-lg tracking-[0.3em] text-slate-900">48 217 3</p>
      <p className="mt-1 text-[10px] text-slate-500">Expires in 09:42</p>
      <Chip tone="amber">Waiting for the partner</Chip>
    </div>
  );
}
function MWallet() {
  const rows = [["Cashback – Savanna Grill", "+$2.40", true], ["Wallet top-up", "+$25.00", true], ["Pass Premium – Monthly", "−$19.00", false]];
  return (
    <div className="px-4">
      <Card className="p-4">
        <div className="flex justify-between"><span className="text-[10px] text-slate-500">Wallet balance</span><Chip>USD</Chip></div>
        <p className="mt-2 text-3xl font-medium text-slate-900">$27.40</p>
        <p className="text-[10px] text-slate-500">Available to spend</p>
        <div className="mt-3 grid grid-cols-2 gap-2"><span className="rounded-lg bg-[#0F4A38] py-2 text-center text-[11px] font-medium text-white">+ Recharge</span><span className="rounded-lg border border-slate-300 py-2 text-center text-[11px] font-medium text-slate-700">Withdraw</span></div>
      </Card>
      <p className="mb-1 mt-4 text-xs font-medium text-slate-900">Recent activity</p>
      {rows.map(([a, b, pos]) => <div key={a} className="flex justify-between border-b border-slate-100 py-2 text-[11px]"><span className="text-slate-700">{a}</span><span className={pos ? "font-medium text-emerald-600" : "font-medium text-slate-900"}>{b}</span></div>)}
    </div>
  );
}
function MRate() {
  return (
    <div className="px-5 pt-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-6 w-6" /></span>
      <p className="mt-3 text-base font-medium text-slate-900">Offer used. You saved $6.50</p>
      <p className="mt-1 text-[11px] text-slate-500">How was Savanna Grill?</p>
      <div className="mt-2 flex justify-center"><Stars /></div>
      <div className="mt-3 rounded-xl border border-slate-200 p-3 text-left text-[11px] text-slate-500">Great food and a warm welcome…</div>
      <p className="mt-2 text-[10px] text-amber-700">Your review appears once approved by the Nelvin team.</p>
    </div>
  );
}
function EAllow() {
  const a = [["Meals", 62, 80], ["Transport", 30, 50], ["Wellness", 10, 40]];
  return (
    <div className="px-4">
      <p className="mb-2 text-sm font-medium text-slate-900">My allowances this month</p>
      {a.map(([n, used, tot]) => (
        <Card key={n} className="mb-2 p-3">
          <div className="flex justify-between text-[11px]"><span className="text-slate-600">{n}</span><span className="font-medium text-slate-900">{money(tot - used)} <span className="font-normal text-slate-400">/ {money(tot)}</span></span></div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0F4A38]" style={{ width: `${(used / tot) * 100}%` }} /></div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------- Laptop screens -------------------------- */
const Kpi = ({ label, value, hint }) => <Card className="p-3"><p className="text-[10px] text-slate-500">{label}</p><p className="text-lg font-medium text-slate-900">{value}</p>{hint && <p className="text-[10px] text-emerald-600">{hint}</p>}</Card>;
const Bars = ({ data, color = "#0F4A38" }) => (
  <div className="flex h-24 items-end gap-2">{data.map((v, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${v}%`, backgroundColor: color, opacity: 0.35 + i * 0.1 }} />)}</div>
);
function HDash() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-slate-900">Acme Bank · Benefits overview</p>
      <div className="grid grid-cols-3 gap-2"><Kpi label="Active employees" value="412 / 480" hint="86% adoption" /><Kpi label="Saved this month" value="$8,940" hint="+18%" /><Kpi label="Offers used" value="1,276" /></div>
      <Card className="p-3"><p className="mb-2 text-[10px] text-slate-500">Monthly adoption</p><Bars data={[35, 48, 55, 62, 75, 88]} /></Card>
    </div>
  );
}
function HBenefits() {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium text-slate-900">Flexible benefits</p>
      {[["Meals", "$80"], ["Transport", "$50"], ["Wellness", "$40"]].map(([n, v]) => (
        <Card key={n} className="flex items-center justify-between p-3 text-xs"><span className="text-slate-700">{n}</span><span className="font-medium text-slate-900">{v} / employee / month</span><Chip tone="green">Active</Chip></Card>
      ))}
      <p className="text-[10px] text-slate-500">Allowances are credited automatically on the 1st of each month.</p>
    </div>
  );
}
const SWATCHES = ["#0F4A38", "#1D4ED8", "#7C3AED", "#B91C1C", "#0F766E"];
function HBrand({ color, setColor }) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      <div>
        <p className="text-sm font-medium text-slate-900">Dashboard customisation</p>
        <p className="mt-1 text-[10px] text-slate-500">Pick your brand colour (click one):</p>
        <div className="mt-2 flex gap-2">{SWATCHES.map((c) => <button key={c} onClick={() => setColor(c)} aria-label={`Brand colour ${c}`} className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-slate-900" : "border-white ring-1 ring-slate-200"}`} style={{ backgroundColor: c }} />)}</div>
        <p className="mt-3 text-[10px] text-slate-500">Logo, banner and welcome message too. The Nelvin marketing team approves each change before it goes live.</p>
        <Chip tone="amber">Growth & Enterprise plans</Chip>
      </div>
      <div className="scale-[.92] rounded-2xl p-3 text-white transition-colors" style={{ backgroundColor: color }}>
        <p className="text-[10px] opacity-80">Acme Bank</p><p className="text-sm font-medium">Welcome to your benefits</p>
        <div className="mt-3 rounded-lg bg-white/15 p-2 text-[10px]">Meals · $62 left</div>
        <div className="mt-2 rounded-lg bg-white py-1.5 text-center text-[10px] font-medium" style={{ color }}>Redeem offer</div>
      </div>
    </div>
  );
}
function PScan() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-slate-900">Validate a customer code</p>
      <Card className="flex items-center gap-3 p-3"><QrCode className="h-8 w-8 text-slate-400" /><span className="font-mono text-lg tracking-[0.3em]">48 217 3</span></Card>
      <Card className="border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><p className="font-medium">Valid · 20% off at Savanna Grill</p><p>Bill $32.50 → customer pays $26.00</p></Card>
    </div>
  );
}
function PStats() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-slate-900">Savanna Grill · this month</p>
      <div className="grid grid-cols-3 gap-2"><Kpi label="New customers" value="64" /><Kpi label="Revenue via Nelvin" value="$2,310" /><Kpi label="Rating" value="4.8 ★" /></div>
      <Card className="p-3"><Bars data={[30, 45, 40, 60, 72, 85]} color="#C8A24A" /></Card>
    </div>
  );
}
function PPay() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-slate-900">Earnings & payouts</p>
      <div className="grid grid-cols-2 gap-2"><Kpi label="Available" value="$1,184" /><Kpi label="Paid out" value="$5,920" /></div>
      <Card className="flex items-center justify-between p-3 text-xs"><span>Payout to Mobile Money</span><Chip tone="amber">Pending</Chip></Card>
      <Card className="flex items-center justify-between p-3 text-xs"><span>Payout · Oct 28</span><Chip tone="green">Paid</Chip></Card>
    </div>
  );
}
function AVet() {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium text-slate-900">Partner vetting</p>
      {[["Glow Beauty Salon", "Documents complete"], ["Atlas Fitness", "Waiting for licence"]].map(([n, s], i) => (
        <Card key={n} className="flex items-center justify-between p-3 text-xs"><div><p className="font-medium text-slate-900">{n}</p><p className="text-slate-500">{s}</p></div>{i === 0 ? <Chip tone="green">Approve</Chip> : <Chip tone="amber">Pending</Chip>}</Card>
      ))}
    </div>
  );
}
function AMod() {
  return (
    <div className="space-y-2 p-4">
      <p className="text-sm font-medium text-slate-900">Moderation queue</p>
      <Card className="p-3 text-xs"><div className="flex justify-between"><span className="font-medium">Amina → Savanna Grill</span><Stars /></div><p className="mt-1 text-slate-500">“Great food and a warm welcome…”</p><div className="mt-2 flex gap-2"><Chip tone="green">Approve</Chip><Chip>Correct</Chip><Chip tone="amber">Reject</Chip></div></Card>
      <Card className="flex items-center justify-between p-3 text-xs"><span>Acme Bank · new branding</span><Chip tone="amber">To review</Chip></Card>
    </div>
  );
}

function Screen({ id, color, setColor }) {
  switch (id) {
    case "m-home": return <MHome />;
    case "m-offer": return <MOffer />;
    case "m-qr": return <MQr />;
    case "m-wallet": return <MWallet />;
    case "m-rate": return <MRate />;
    case "e-home": return <MHome brand={{ color, name: "Acme Bank" }} />;
    case "e-allow": return <EAllow />;
    case "h-dash": return <HDash />;
    case "h-benefits": return <HBenefits />;
    case "h-brand": return <HBrand color={color} setColor={setColor} />;
    case "p-scan": return <PScan />;
    case "p-stats": return <PStats />;
    case "p-pay": return <PPay />;
    case "a-vet": return <AVet />;
    case "a-mod": return <AMod />;
    default: return null;
  }
}

/* ------------------------------- Page ------------------------------- */
export default function Demo() {
  const [roleId, setRoleId] = useState("member");
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const [color, setColor] = useState("#1D4ED8");
  const role = useMemo(() => ROLES.find((r) => r.id === roleId), [roleId]);
  const cur = role.steps[step];

  useEffect(() => { document.title = "Nelvin Benefits — Interactive demo"; }, []);
  useEffect(() => { setStep(0); }, [roleId]);
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => setStep((s) => {
      if (s + 1 < role.steps.length) return s + 1;
      const i = ROLES.findIndex((r) => r.id === roleId);
      setRoleId(ROLES[(i + 1) % ROLES.length].id);
      return 0;
    }), 5500);
    return () => clearInterval(id);
  }, [auto, role, roleId]);

  const go = (d) => setStep((s) => Math.min(role.steps.length - 1, Math.max(0, s + d)));
  const Frame = role.device === "phone" ? PhoneFrame : LaptopFrame;

  return (
    <div className="min-h-screen bg-white text-slate-900 md:bg-[#FAF6EC]">
      <SiteHeader />
      <main>
        <section className="bg-[#08261D] px-4 pb-10 pt-12 text-white sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-block rounded-full border border-[#C8A24A] px-3 py-1 text-xs text-[#E6CF8B]">Interactive demo · demo data, nothing is real</span>
            <h1 className="mt-4 text-3xl font-medium leading-tight sm:text-5xl">Understand Nelvin in 30 seconds</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-white/75">Nelvin connects <b className="font-medium text-white">people and companies</b> with <b className="font-medium text-white">local partners</b>: discounts, cashback and employee benefits in one app. No login needed. Pick who you are below.</p>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {[[Users, "People", "save money and earn cashback every day"], [Building2, "Companies", "give flexible benefits to their teams"], [Store, "Partners", "win new customers and get paid per sale"]].map(([I, h, p]) => (
                <div key={h} className="rounded-2xl bg-white/10 p-4"><I className="h-5 w-5 text-[#E6CF8B]" strokeWidth={1.5} /><p className="mt-2 text-sm font-medium">{h}</p><p className="text-xs text-white/70">{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Choose a role" className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const I = r.icon;
                return (
                  <button key={r.id} role="tab" aria-selected={roleId === r.id} onClick={() => { setAuto(false); setRoleId(r.id); }} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${roleId === r.id ? "bg-[#0F4A38] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                    <I className="h-4 w-4" strokeWidth={1.5} /> {r.label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setAuto((a) => !a)} className="flex h-11 items-center gap-2 rounded-full border border-[#C8A24A] bg-white px-4 text-sm font-medium text-[#84631A]">
              {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {auto ? "Stop presentation" : "Presentation mode"}
            </button>
          </div>

          <p className="mt-6 text-lg text-slate-700">{role.pitch}</p>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
            <ol className="space-y-2">
              {role.steps.map((s, i) => (
                <li key={s.screen + i}>
                  <button onClick={() => { setAuto(false); setStep(i); }} aria-current={i === step ? "step" : undefined} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition ${i === step ? "border-[#0F4A38] bg-white shadow-sm" : "border-slate-200 bg-white/60 hover:bg-white"}`}>
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${i === step ? "bg-[#0F4A38] text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                    <span><span className="block text-sm font-medium text-slate-900">{s.title}</span>{i === step && <span className="mt-1 block text-sm text-slate-600">{s.why}</span>}</span>
                  </button>
                </li>
              ))}
              <li className="flex items-center gap-2 pt-2">
                <button onClick={() => go(-1)} disabled={step === 0} aria-label="Previous step" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => go(1)} disabled={step === role.steps.length - 1} aria-label="Next step" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
                <span className="text-xs text-slate-500">Step {step + 1} of {role.steps.length}</span>
              </li>
            </ol>

            <div className="relative">
              <Frame>
                <AnimatePresence mode="wait">
                  <motion.div key={roleId + cur.screen} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full">
                    <Screen id={cur.screen} color={color} setColor={setColor} />
                  </motion.div>
                </AnimatePresence>
              </Frame>
              <p className="mt-3 text-center text-[11px] text-slate-400">Illustrative screens with fictional data</p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[24px] bg-[#0F4A38] p-8 text-center text-white">
            <NelvinLogo className="mx-auto h-8" />
            <h2 className="mt-3 text-2xl font-medium">Ready to try it for real?</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-[#0F4A38]">Create a free account <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/pricing" className="inline-flex h-12 items-center rounded-xl border border-white/30 px-6 text-sm font-medium">See plans for companies</Link>
              <Link to="/merchant" className="inline-flex h-12 items-center rounded-xl border border-white/30 px-6 text-sm font-medium">Become a partner</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
