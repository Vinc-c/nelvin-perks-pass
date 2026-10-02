const ADMIN_ROLES = ["SUPER_ADMIN", "admin"];

const HOME_BY_ROLE = {
  HR_ADMIN: "/hr",
  EMPLOYEE: "/employee",
  MERCHANT: "/merchant-dashboard",
  MEMBER: "/member",
};

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  admin: "Super Admin",
  HR_ADMIN: "Entreprise / RH",
  EMPLOYEE: "Employé",
  MERCHANT: "Marchand",
  MEMBER: "Particulier",
  user: "Particulier",
};

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