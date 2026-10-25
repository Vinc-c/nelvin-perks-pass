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
  user: "role.MEMBER",
};

/** Translated role label (falls back to the raw role). */
export const roleLabel = (role) => (ROLE_KEYS[role] ? translate(ROLE_KEYS[role]) : role);

// Kept for existing consumers: values resolve in the current language on access.
export const ROLE_LABELS = {};
Object.keys(ROLE_KEYS).forEach((role) => {
  Object.defineProperty(ROLE_LABELS, role, { enumerable: true, get: () => translate(ROLE_KEYS[role]) });
});

export const isAdmin = (user) => !!user && ADMIN_ROLES.includes(user.role);

// Onboarding is complete only when the `onboarded` flag is true (admins are
// always considered onboarded). Role-based bypass is intentionally removed so
// every account — including invited employees — must pass through the
// onboarding screen before reaching its dashboard.
export const isOnboarded = (user) => !!user && (isAdmin(user) || user.onboarded === true);

export function homeFor(user) {
  if (!user) return "/login";
  if (isAdmin(user)) return "/admin";
  if (!isOnboarded(user)) return "/onboarding";
  return HOME_BY_ROLE[user.role] || "/member";
}