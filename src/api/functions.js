// Calls a Supabase Edge Function. Resolves to `{ data }`; throws an Error whose
// message is the server's `error` field on non-2xx responses.
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { checkVpn } from "@/lib/vpn";

// Functions that move money: refresh the VPN verdict first (the database enforces it).
const SENSITIVE = new Set(["create-checkout", "withdraw-wallet"]);

export async function invokeFunction(name, body = {}) {
  if (SENSITIVE.has(name)) await checkVpn({ force: true });
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return { data };

  let payload = null;
  let status;
  if (error instanceof FunctionsHttpError && error.context) {
    status = error.context.status;
    try {
      payload = await error.context.json();
    } catch {
      payload = null;
    }
  }
  const err = new Error(payload?.error || payload?.message || error.message || "Request failed");
  err.status = status;
  err.data = payload;
  throw err;
}
