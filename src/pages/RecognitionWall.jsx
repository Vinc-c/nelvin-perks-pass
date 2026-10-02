import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Award, Heart, ThumbsUp, Sparkles, Send, TrendingUp } from "lucide-react";

const badgeOptions = [
  { id: "team", label: "Team Player", icon: ThumbsUp, color: "emerald" },
  { id: "innovator", label: "Innovator", icon: Sparkles, color: "blue" },
  { id: "wellness", label: "Wellness Champ", icon: Heart, color: "rose" },
  { id: "topsaver", label: "Top Saver", icon: Award, color: "amber" },
];

const colleagues = ["Kwame Mensah", "Aisha Bello", "John Mwangi", "Fatima Zahra", "Daniel Tadesse"];

const initialFeed = [
  { id: "r1", from: "Amara Diallo", to: "Kwame Mensah", badge: "team", message: "Saved the launch with quick thinking on the router fallback!", date: "2026-10-02", likes: 7 },
  { id: "r2", from: "Aisha Bello", to: "Amara Diallo", badge: "topsaver", message: "Top saver this quarter — inspired the whole team to use perks.", date: "2026-09-30", likes: 12 },
  { id: "r3", from: "John Mwangi", to: "Fatima Zahra", badge: "wellness", message: "Led the wellness month challenge. Thank you!", date: "2026-09-28", likes: 9 },
];

export default function RecognitionWall() {
  const [feed, setFeed] = useState(initialFeed);
  const [to, setTo] = useState(colleagues[0]);
  const [badge, setBadge] = useState("team");
  const [message, setMessage] = useState("");
  const [liked, setLiked] = useState({});

  const post = () => {
    if (!message.trim()) return;
    setFeed((f) => [{ id: `r${Date.now()}`, from: "You", to, badge, message, date: "2026-10-02", likes: 0 }, ...f]);
    setMessage("");
  };

  const like = (id) => setLiked((l) => ({ ...l, [id]: !l[id] }));

  const topRecognized = [...feed].reduce((acc, r) => { acc[r.to] = (acc[r.to] || 0) + 1; return acc; }, {});

  return (
    <PortalLayout title="Employee Recognition" theme="light">
      {/* Compose */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Award className="h-5 w-5 text-amber-500" /> Recognize a colleague</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-500">Colleague</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
              {colleagues.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="text-sm">
            <span className="text-slate-500">Badge</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {badgeOptions.map((b) => {
                const Icon = b.icon;
                return (
                  <button key={b.id} onClick={() => setBadge(b.id)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${badge === b.id ? `bg-${b.color}-50 border-${b.color}-500 text-${b.color}-600` : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <Icon className="h-3.5 w-3.5" /> {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a few words of praise..." rows={3} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        <button onClick={post} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600">
          <Send className="h-4 w-4" /> Post recognition
        </button>
      </motion.div>

      {/* Top recognized */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <TrendingUp className="h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800"><span className="font-semibold">Most recognized this month:</span> {Object.entries(topRecognized).map(([n, c]) => `${n} (${c})`).join(" · ")}</p>
      </motion.div>

      {/* Feed */}
      <div className="mt-6 space-y-3">
        {feed.map((r, i) => {
          const b = badgeOptions.find((x) => x.id === r.badge) || badgeOptions[0];
          const Icon = b.icon;
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${b.color}-50`}><Icon className={`h-5 w-5 text-${b.color}-600`} /></span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">{r.from}</span> recognized <span className="font-semibold text-slate-900">{r.to}</span></p>
                  <p className="mt-1 text-sm text-slate-600">{r.message}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <button onClick={() => like(r.id)} className={`flex items-center gap-1 transition ${liked[r.id] ? "text-rose-500" : "hover:text-rose-500"}`}>
                      <Heart className={`h-4 w-4 ${liked[r.id] ? "fill-rose-500" : ""}`} /> {r.likes + (liked[r.id] ? 1 : 0)}
                    </button>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">{b.label}</span>
                    <span>{r.date}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PortalLayout>
  );
}