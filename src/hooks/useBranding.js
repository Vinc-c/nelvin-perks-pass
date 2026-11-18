import { useCallback, useEffect, useState } from "react";
import { callRpc } from "@/api/rpc";
import { useAuth } from "@/lib/AuthContext";

/** White-label branding of the caller's company (null for individuals / ineligible plans). */
export function useBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState(null);
  const [ready, setReady] = useState(false);
  const enabled = !!user?.company_id && (user.role === "EMPLOYEE" || user.role === "HR_ADMIN");
  const reload = useCallback(() => {
    if (!enabled) { setBranding(null); setReady(true); return Promise.resolve(); }
    return callRpc("get_my_branding").then(setBranding, () => setBranding(null)).finally(() => setReady(true));
  }, [enabled]);
  useEffect(() => { reload(); }, [reload, user?.id]);
  return { branding, ready, reload, live: branding?.live || null };
}

/** "#RRGGBB" → "r g b" for the CSS variables used by Tailwind tokens. */
export function hexToTriplet(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Readable text color (black/white) for a background hex. */
export function contrastOn(hex) {
  const t = hexToTriplet(hex);
  if (!t) return "#fff";
  const [r, g, b] = t.split(" ").map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1A2060" : "#fff";
}
