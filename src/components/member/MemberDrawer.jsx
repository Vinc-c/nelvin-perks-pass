import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, CreditCard, Gem, LifeBuoy, LogOut, Lock, MapPin, Bell, Search, Settings, Share2, ArrowLeftRight, History, Wallet } from "lucide-react";
import NelvinLogo from "@/components/NelvinLogo";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { signOut } from "@/api/auth";
import { displayName } from "@/components/member/MemberWelcomeBanner";

const GROUPS = [
  { key: "rd.g.money", items: [
    { to: "/wallet-activity", label: "rd.i.wallet", icon: Wallet },
    { to: "/reward-history", label: "rd.i.cashback", icon: History },
    { to: "/currency-exchange", label: "rd.i.currencies", icon: ArrowLeftRight },
  ] },
  { key: "rd.g.discover", items: [
    { to: "/merchant-directory", label: "rd.i.directory", icon: Search },
    { to: "/merchant-map", label: "rd.i.near", icon: MapPin },
  ] },
  { key: "rd.g.membership", items: [
    { to: "/membership-plans", label: "rd.i.pass", icon: Gem },
    { to: "/referral-program", label: "rd.i.refer", icon: Share2 },
  ] },
  { key: "rd.g.account", items: [
    { to: "/notifications", label: "rd.notifications", icon: Bell },
    { to: "/billing-settings", label: "rd.i.billing", icon: CreditCard },
    { to: "/security-settings", label: "rd.i.security", icon: Lock },
    { to: "/settings", label: "rd.i.settings", icon: Settings },
    { to: "/help-center", label: "rd.i.help", icon: LifeBuoy },
  ] },
];

/** Mobile side menu for members: profile card, four groups, red log out. */
export default function MemberDrawer({ onNavigate }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const name = displayName(user);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 px-2"><Link to="/member" onClick={onNavigate}><NelvinLogo className="h-8" /></Link></div>
      <Link to="/settings" onClick={onNavigate} className="mb-2 flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nv-emerald text-sm font-medium text-white ring-2 ring-nv-gold">{(name[0] || "?").toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium leading-tight text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{t("rd.individual")}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 rtl:rotate-180" strokeWidth={1.5} />
      </Link>
      <nav className="min-h-0 flex-1 overflow-y-auto">
        {GROUPS.map((g) => (
          <div key={g.key} className="pt-3">
            <p className="px-3 pb-1 text-xs text-slate-500">{t(g.key)}</p>
            {g.items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.to;
              return (
                <Link key={it.to} to={it.to} onClick={onNavigate} className={`flex h-12 items-center gap-3 rounded-xl px-3 text-sm ${active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}>
                  <Icon className={`h-[22px] w-[22px] shrink-0 ${active ? "text-nv-emerald" : "text-slate-500"}`} strokeWidth={1.5} />
                  <span>{t(it.label)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-2 border-t border-slate-200 pt-2">
        <button onClick={() => signOut("/")} className="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-600 hover:bg-red-50">
          <LogOut className="h-[22px] w-[22px]" strokeWidth={1.5} /> {t("ui.signOut")}
        </button>
      </div>
    </div>
  );
}
