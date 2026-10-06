import { createClient } from "@supabase/supabase-js";

// Production project. The URL and publishable key are public by design (data
// is protected by Row Level Security), so they are safe defaults: a build made
// without VITE_* variables (e.g. a hosting provider not yet configured) still
// reaches Supabase instead of failing every request with "Failed to fetch".
const DEFAULT_URL = "https://wdxgflyhjhcevdruvfjb.supabase.co";
const DEFAULT_KEY = "sb_publishable_H5mM1XJurPF8kfbM2HCr9A_nqlFeEm_";

const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Ignore placeholders and local URLs in a production build.
const usable = (u) => /^https?:\/\//.test(u) && !(import.meta.env.PROD && /localhost|127\.0\.0\.1|your-project/.test(u));

const url = usable(envUrl) ? envUrl : DEFAULT_URL;
const key = envKey && !/your-|missing/.test(envKey) ? envKey : DEFAULT_KEY;

export const isSupabaseConfigured = true;
export const supabaseUrl = url;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
