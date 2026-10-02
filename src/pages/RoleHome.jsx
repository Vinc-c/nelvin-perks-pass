import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { homeFor } from "@/lib/roles";

// Single post-login entry point: sends each user to their own portal.
export default function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={homeFor(user)} replace />;
}