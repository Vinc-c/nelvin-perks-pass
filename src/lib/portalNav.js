import {
  Search, MapPin, Wallet, Gift, Settings, Award, BarChart3, FileText,
  CreditCard, Megaphone, BadgeCheck, Shield, Store,
  LayoutDashboard, Star, Image as ImageIcon, Type, Crown, Building2, Ticket,
  Activity, Globe, Bell, Lock, LifeBuoy, MessageSquare, History, ArrowLeftRight,
  Users, UserPlus, SlidersHorizontal, ScanLine, Tag, Banknote, QrCode, Share2,
  Gem, Headphones, PiggyBank, TrendingUp, GitPullRequest, KeyRound, ScrollText,
} from "lucide-react";
import { isAdmin } from "@/lib/roles";

const group = (name, items) => items.map((item) => ({ ...item, group: name }));

const SUPPORT = group("Support", [
  { to: "/help-center", label: "Centre d'aide", icon: LifeBuoy },
  { to: "/support-tickets", label: "Mes tickets", icon: MessageSquare },
]);

const account = (extra = []) => group("Compte", [
  { to: "/notifications", label: "Notifications", icon: Bell },
  ...extra,
  { to: "/security-settings", label: "Sécurité", icon: Lock },
  { to: "/settings", label: "Paramètres", icon: Settings },
]);

const FINANCES = group("Finances", [
  { to: "/wallet-activity", label: "Activité wallet", icon: Wallet },
  { to: "/reward-history", label: "Historique cashback", icon: History },
  { to: "/currency-exchange", label: "Devises", icon: ArrowLeftRight },
]);

const EXPLORE = group("Explorer", [
  { to: "/merchant-directory", label: "Annuaire marchands", icon: Search },
  { to: "/merchant-map", label: "Près de moi", icon: MapPin },
]);

const NAV = {
  MEMBER: [
    ...group("Tableau de bord", [
      { to: "/member", section: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/member", section: "wallet", label: "Mon wallet", icon: Wallet },
      { to: "/member", section: "offers", label: "Offres", icon: Tag },
      { to: "/member", section: "activity", label: "Transactions", icon: Activity },
    ]),
    ...EXPLORE,
    ...FINANCES,
    ...group("Avantages", [
      { to: "/my-rewards", label: "Mes récompenses", icon: Gift },
      { to: "/membership-plans", label: "Abonnement Pass", icon: Gem },
      { to: "/referral-program", label: "Parrainage", icon: Share2 },
    ]),
    ...account([{ to: "/billing-settings", label: "Facturation", icon: CreditCard }]),
    ...SUPPORT,
  ],
  EMPLOYEE: [
    ...group("Tableau de bord", [
      { to: "/employee", section: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/employee", section: "wallet", label: "Wallet & allocations", icon: PiggyBank },
      { to: "/employee", section: "badges", label: "Mes badges", icon: Award },
      { to: "/employee", section: "offers", label: "Offres employé", icon: QrCode },
      { to: "/employee", section: "history", label: "Historique", icon: History },
    ]),
    ...group("Entreprise", [
      { to: "/recognition-wall", label: "Mur de reconnaissance", icon: Users },
      { to: "/my-rewards", label: "Mes récompenses", icon: Gift },
      { to: "/referral-program", label: "Parrainage", icon: Share2 },
    ]),
    ...EXPLORE,
    ...FINANCES,
    ...account(),
    ...SUPPORT,
  ],
  HR_ADMIN: [
    ...group("Tableau de bord", [
      { to: "/hr", section: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/hr", section: "analytics", label: "Adoption & économies", icon: TrendingUp },
      { to: "/hr", section: "benefits", label: "Avantages flexibles", icon: SlidersHorizontal },
      { to: "/hr", section: "invitations", label: "Invitations", icon: UserPlus },
      { to: "/hr", section: "employees", label: "Employés", icon: Users },
    ]),
    ...group("Rapports", [
      { to: "/hr-savings-report", label: "Rapport d'économies", icon: BarChart3 },
      { to: "/monthly-reports", label: "Rapports mensuels", icon: FileText },
      { to: "/analytics", label: "Analytics", icon: Activity },
    ]),
    ...group("Engagement", [
      { to: "/recognition-wall", label: "Reconnaissance", icon: Award },
      { to: "/merchant-directory", label: "Catalogue d'offres", icon: Search },
    ]),
    ...account([{ to: "/billing-settings", label: "Abonnement", icon: CreditCard }]),
    ...SUPPORT,
  ],
  MERCHANT: [
    ...group("Tableau de bord", [
      { to: "/merchant-dashboard", section: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/merchant-dashboard", section: "scan", label: "Validation des codes", icon: ScanLine },
      { to: "/merchant-dashboard", section: "redemptions", label: "Redemptions", icon: History },
      { to: "/merchant-dashboard", section: "offers", label: "Offres & campagnes", icon: Tag },
      { to: "/merchant-dashboard", section: "payout", label: "Revenus & paiements", icon: Banknote },
    ]),
    ...group("Gestion", [
      { to: "/campaign-editor", label: "Éditeur de campagnes", icon: Megaphone },
      { to: "/kyc-verification", label: "Vérification KYC", icon: BadgeCheck },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ]),
    ...account([{ to: "/billing-settings", label: "Abonnement", icon: CreditCard }]),
    ...SUPPORT,
  ],
  ADMIN: [
    ...group("Pilotage", [
      { to: "/admin", section: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ]),
    ...group("Contenu (CMS)", [
      { to: "/admin", section: "cms_logos", label: "CMS Logos", icon: Star },
      { to: "/admin", section: "cms_images", label: "CMS Images", icon: ImageIcon },
      { to: "/admin", section: "cms_copy", label: "CMS Marketing", icon: Type },
      { to: "/admin", section: "cms_categories", label: "CMS Catégories", icon: Tag },
    ]),
    ...group("Clients & partenaires", [
      { to: "/admin", section: "companies", label: "Entreprises", icon: Building2 },
      { to: "/admin", section: "kyc", label: "Validation marchands", icon: Shield },
      { to: "/admin", section: "offers", label: "Offres & SEO", icon: Tag },
      { to: "/admin", section: "sales", label: "Codes commerciaux", icon: Ticket },
      { to: "/merchant-directory", label: "Annuaire marchands", icon: Store },
    ]),
    ...group("Paiements", [
      { to: "/admin", section: "payments", label: "Paiements & retraits", icon: Banknote },
      { to: "/admin", section: "psp", label: "Clés PSP & routage", icon: KeyRound },
      { to: "/admin", section: "plans", label: "Plans & tarifs", icon: Gem },
      { to: "/admin", section: "currency", label: "Devises", icon: Globe },
    ]),
    ...group("Plateforme", [
      { to: "/admin", section: "staff", label: "Super Admins", icon: Crown },
      { to: "/admin", section: "settings", label: "Paramètres plateforme", icon: SlidersHorizontal },
      { to: "/admin", section: "audit", label: "Journal d'audit", icon: ScrollText },
      { to: "/pull-requests", label: "PR à reviewer", icon: GitPullRequest },
    ]),
    ...group("Support", [
      { to: "/support-center", label: "Help Desk", icon: Headphones },
      { to: "/support-tickets", label: "Tickets", icon: MessageSquare },
    ]),
    ...account(),
  ],
};

// Section items open a dashboard module. When a super admin previews another
// portal, shared pages carry `?portal=` so the sidebar stays on that portal.
export function navHref(item) {
  if (item.section) return `${item.to}?section=${item.section}`;
  if (item.portal) return `${item.to}?portal=${item.portal}`;
  return item.to;
}

export function isNavActive(item, pathname, search) {
  if (pathname !== item.to) return false;
  if (!item.section) return true;
  return (new URLSearchParams(search).get("section") || "overview") === item.section;
}

// Pages that belong to exactly one portal. Shared pages (offers, wallet,
// settings…) are not listed: they keep the portal the user came from.
const PORTAL_BY_PREFIX = [
  ["/hr", "HR_ADMIN"],
  ["/hr-savings-report", "HR_ADMIN"],
  ["/monthly-reports", "HR_ADMIN"],
  ["/employee", "EMPLOYEE"],
  ["/member", "MEMBER"],
  ["/merchant-dashboard", "MERCHANT"],
  ["/campaign-editor", "MERCHANT"],
  ["/kyc-verification", "MERCHANT"],
  ["/admin", "ADMIN"],
];

// Which portal the user is currently in. Regular users are always in their
// own role's portal. Super admins are in the Admin portal everywhere, except
// on a portal-specific page or a shared page opened with `?portal=` from
// that portal's sidebar (preview mode).
export function currentPortal(user, pathname = "", search = "") {
  if (!isAdmin(user)) return NAV[user?.role] ? user.role : "MEMBER";
  const fromPath = PORTAL_BY_PREFIX.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1];
  if (fromPath) return fromPath;
  const fromQuery = new URLSearchParams(search).get("portal");
  return NAV[fromQuery] ? fromQuery : "ADMIN";
}

export function navFor(user, pathname = "", search = "") {
  const portal = currentPortal(user, pathname, search);
  if (!isAdmin(user) || portal === "ADMIN") return NAV[portal];
  return NAV[portal].map((item) => ({ ...item, portal }));
}
/** Translation key for a navigation label (French source label -> "nav.l.<slug>"). */
export const navKey = (label) =>
  "nav.l." + String(label).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
