// Calls a Postgres function (RPC). Throws an Error with the database message
// (business rules raise readable French messages server-side).
import { supabase } from "./supabaseClient";

export async function callRpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    const err = new Error(error.message || "Erreur serveur");
    err.code = error.code;
    throw err;
  }
  return data;
}
