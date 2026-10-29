// VPN / proxy awareness. `vpn-check` records the verdict server-side; the
// database refuses payments and withdrawals while a VPN was seen (see
// migration 20261028130000). Here we refresh the verdict and let the UI warn.
import { supabase } from "@/api/supabaseClient";

let last = { vpn: false, at: 0 };
const listeners = new Set();

export const getVpnState = () => last.vpn;
export const onVpnChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export async function checkVpn({ force = false } = {}) {
  if (!force && Date.now() - last.at < 60_000) return last.vpn;
  try {
    const { data, error } = await supabase.functions.invoke("vpn-check", { body: {} });
    if (error) return last.vpn;
    const next = data?.vpn === true;
    const changed = next !== last.vpn;
    last = { vpn: next, at: Date.now() };
    if (changed) listeners.forEach((fn) => fn(next));
    return next;
  } catch {
    return last.vpn; // fail-open
  }
}
