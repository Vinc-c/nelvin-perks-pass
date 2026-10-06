// Calls a Supabase Edge Function. Resolves to `{ data }`; throws an Error whose
// message is the server's `error` field on non-2xx responses.
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export async function invokeFunction(name, body = {}) {
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
