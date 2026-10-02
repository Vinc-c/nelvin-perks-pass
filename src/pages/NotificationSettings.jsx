import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Bell, Mail, MessageSquare, Save, Check } from "lucide-react";

const channels = [
  { key: "push", title: "Push notifications", icon: Bell, color: "emerald" },
  { key: "email", title: "Email alerts", icon: Mail, color: "blue" },
  { key: "sms", title: "SMS updates", icon: MessageSquare, color: "amber" },
];

const events = [
  { key: "cashback", label: "Cashback credited", desc: "When cashback is added to your wallet" },
  { key: "payments", label: "Payment activity", desc: "Recharges, withdrawals and payouts" },
  { key: "offers", label: "New offers nearby", desc: "Deals and promotions around you" },
  { key: "security", label: "Security alerts", desc: "Logins and account changes" },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    push: { cashback: true, payments: true, offers: false, security: true },
    email: { cashback: true, payments: true, offers: true, security: true },
    sms: { cashback: false, payments: true, offers: false, security: true },
  });
  const [saved, setSaved] = useState(false);

  const toggle = (channel, event) =>
    setPrefs((p) => ({ ...p, [channel]: { ...p[channel], [event]: !p[channel][event] } }));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <PortalLayout title="Notification Settings" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Notification preferences</h1>
        <p className="text-sm text-slate-500">Choose how you receive cashback, payment and offer updates.</p>
      </div>

      <div className="space-y-4">
        {channels.map((ch, ci) => {
          const Icon = ch.icon;
          return (
            <motion.div key={ch.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${ch.color}-50`}><Icon className={`h-5 w-5 text-${ch.color}-600`} /></span>
                {ch.title}
              </h3>
              <div className="mt-4 divide-y divide-slate-100">
                {events.map((e) => {
                  const on = prefs[ch.key][e.key];
                  return (
                    <div key={e.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{e.label}</p>
                        <p className="text-xs text-slate-500">{e.desc}</p>
                      </div>
                      <button onClick={() => toggle(ch.key, e.key)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
          <Save className="h-4 w-4" /> Save preferences
        </button>
        {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </PortalLayout>
  );
}