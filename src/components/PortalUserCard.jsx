import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/api/entities";
import { signOut } from "@/api/auth";
import { useAuth } from "@/lib/AuthContext";
import { ROLE_LABELS } from "@/lib/roles";
import { LogOut, Bell } from "lucide-react";

export default function PortalUserCard() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const name = user?.full_name || user?.email || "";

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const list = await entities.Notification.filter({ user_id: user.id, read: false }, "-created_date", 50);
        setUnread((list || []).length);
      } catch { setUnread(0); }
    };
    load();
    const unsub = entities.Notification.subscribe(load, { filter: `user_id=eq.${user.id}` });
    return unsub;
  }, [user?.id]);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-sm font-bold text-white">
        {(name[0] || "?").toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user?.role] || "Particulier"}</p>
      </div>
      <Link to="/notifications" title="Notifications" className="relative rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-emerald-600">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </Link>
      <button
        onClick={() => signOut("/")}
        title="Se déconnecter"
        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}