import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin, isOnboarded, homeFor } from "@/lib/roles";

// Gates a group of routes by role. No `allow` = any onboarded user.
// Super admins can access every portal.
export default function RoleRoute({ allow }) {
  const { user } = useAuth();
  if (!isOnboarded(user)) return <Navigate to="/onboarding" replace />;
  if (!allow || isAdmin(user) || allow.includes(user.role)) return <Outlet />;
  return <Navigate to={homeFor(user)} replace />;
}