import { translate } from "@/i18n/translate";

const ADMIN_ROLES = ["SUPER_ADMIN", "admin"];

const HOME_BY_ROLE = {
  HR_ADMIN: "/hr",
  EMPLOYEE: "/employee",
  MERCHANT: "/merchant-dashboard",
  MEMBER: "/member",
};

// Role -> i18n key (role.* keys live in messages/nav.js).
const ROLE_KEYS = {
  SUPER_ADMIN: "role.SUPER_ADMIN",
  admin: "role.SUPER_ADMIN",
  HR_ADMIN: "role.HR_ADMIN",
  EMPLOYEE: "role.EMPLOYEE",
  MERCHANT: "role.MERCHANT",
  MEMBER: "role.MEMBER",
  STAFF: "role.STAFF",
  user: "role.MEMBER",
};

/** Translated role label (falls back to the raw role). */
export const roleLabel = (role) => (ROLE_KEYS[role] ? translate(ROLE_KEYS[role]) : role);

// Kept for existing consumers: values resolve in the current language on access.
export const ROLE_LABELS = {};
Object.keys(ROLE_KEYS).forEach((role) => {
  Object.defineProperty(ROLE_LABELS, role, { enumerable: true, get: () => translate(ROLE_KEYS[role]) });
});

// Nelvin agents: scoped back-office access. The database enforces the same limits (has_perm()); this only shapes the UI.
export const STAFF_ROLES = {
  MARKETING: { label: "Marketing", desc: "Images, texts, banners, categories, partner logos, blog and SEO", sections: ["cms_logos", "cms_images", "cms_copy", "cms_categories", "marketing"], home: "/admin?section=cms_images" },
  FINANCE: { label: "Finance", desc: "Partner payouts, withdrawals and the transaction ledger", sections: ["payments"], home: "/admin?section=payments" },
  SUPPORT: { label: "Support", desc: "Help desk and support tickets", sections: [], home: "/support-tickets" },
  SALES: { label: "Sales", desc: "Paid promotions review and sponsored placements", sections: ["promotions"], home: "/admin?section=promotions" },
};
export const isStaff = (user) => !!user && user.role === "STAFF";
export const staffSections = (user) => STAFF_ROLES[user?.staff_role]?.sections || [];
const STAFF_PAGES = { SUPPORT: ["/support-tickets", "/support-center"] };
export const isHelpDeskAgent = (user) => isStaff(user) && user.staff_role === "SUPPORT";
export const staffCanOpen = (user, to) => (STAFF_PAGES[user?.staff_role] || []).includes(to);

export const isAdmin = (user) => !!user && ADMIN_ROLES.includes(user.role);
export const canHelpDesk = (user) => isAdmin(user) || isHelpDeskAgent(user);

// Onboarding is complete only when the `onboarded` flag is true (admins are
// always considered onboarded). Role-based bypass is intentionally removed so
// every account — including invited employees — must pass through the
// onboarding screen before reaching its dashboard.
export const isOnboarded = (user) => !!user && (isAdmin(user) || isStaff(user) || user.onboarded === true);

export function homeFor(user) {
  if (!user) return "/login";
  if (isAdmin(user)) return "/admin";
  if (isStaff(user)) return STAFF_ROLES[user.staff_role]?.home || "/notifications";
  if (!isOnboarded(user)) return "/onboarding";
  return HOME_BY_ROLE[user.role] || "/member";
}