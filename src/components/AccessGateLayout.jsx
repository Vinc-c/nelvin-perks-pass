import React from "react";
import { Outlet } from "react-router-dom";
import AccessGate from "@/components/AccessGate";

// Layout route that blocks transactional shared pages when the user's
// subscription/membership has ended. Billing & membership pages stay
// outside this gate so the user can always renew.
export default function AccessGateLayout() {
  return (
    <AccessGate>
      <Outlet />
    </AccessGate>
  );
}