import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, Megaphone, Bell, Gift, Check, CheckCheck, Trash2, Loader2, RefreshCw, Tag } from "lucide-react";
import { EmptyState } from "@/components/UiFeedback";

const iconMap = { CASHBACK: Wallet, RECHARGE: Wallet, REDEMPTION: Tag, ANNOUNCEMENT: Megaphone, ALERT: Bell, REWARD: Gift, SYSTEM: Bell };
const colorMap = { CASHBACK: "emerald", RECHARGE: "emerald", REDEMPTION: "emerald", ANNOUNCEMENT: "amber", ALERT: "rose", REWARD: "blue", SYSTEM: "slate" };

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await entities.Notification.filter({ user_id: user.id }, "-created_date", 100);
      setNotifications(list || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    if (!user?.id) return undefined;
    const unsub = entities.Notification.subscribe(() => load(), { filter: `user_id=eq.${user.id}` });
    return unsub;
  }, [load, user?.id]);

  const markRead = async (id) => {
    try { await entities.Notification.update(id, { read: true }); } catch {}
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await entities.Notification.bulkUpdate(unread.map((n) => ({ id: n.id, read: true })));
    } catch {}
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id) => {
    try { await entities.Notification.delete(id); } catch {}
    setNotifications((p) => p.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter((n) => !n.read)
    : notifications.filter((n) => n.type === filter);

  const filters = [
    { id: "all", label: "Toutes" },
    { id: "unread", label: "Non lues" },
    { id: "CASHBACK", label: "Cashback" },
    { id: "RECHARGE", label: "Recharges" },
    { id: "ANNOUNCEMENT", label: "Annonces" },
    { id: "ALERT", label: "Alertes" },
  ];

  return (
    <PortalLayout title="Notifications" theme="light">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{unreadCount} non lue{unreadCount > 1 ? "s" : ""} · cashback, recharges & annonces</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 not-pill rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={markAllRead} disabled={unreadCount === 0} className="flex items-center gap-1.5 not-pill rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"><CheckCheck className="h-4 w-4" /> Tout marquer lu</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${filter === f.id ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{f.label}</button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" description="Vos cashbacks, recharges et annonces apparaîtront ici." />
        ) : (
          filtered.map((n, i) => {
            const Icon = iconMap[n.type] || Bell;
            const color = colorMap[n.type] || "slate";
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${n.read ? "border-slate-200 bg-white" : "border-slate-200 bg-white shadow-sm ring-1 ring-emerald-100"}`}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-${color}-50`}>
                  <Icon className={`h-5 w-5 text-${color}-600`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium ${n.read ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">{new Date(n.created_date).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{n.body}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="Marquer comme lu" className="not-pill rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Check className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => remove(n.id)} title="Supprimer" className="not-pill rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
                {!n.read && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />}
              </motion.div>
            );
          })
        )}
      </div>
    </PortalLayout>
  );
}