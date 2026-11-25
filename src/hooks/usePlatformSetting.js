import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";

/** Reads one public platform setting (jsonb). Returns `fallback` while loading or when unset. */
export function usePlatformSetting(key, fallback) {
  const { data } = useQuery({
    queryKey: ["platform-setting", key],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: row } = await supabase.from("platform_settings").select("value").eq("key", key).maybeSingle();
      return row?.value ?? null;
    },
  });
  return data ?? fallback;
}

const DEFAULT_PROVIDERS = { google: 1, apple: 0, phone: 0 };
/** Which login options the super admin switched on. */
export function useAuthProviders() {
  return { ...DEFAULT_PROVIDERS, ...(usePlatformSetting("auth_providers", DEFAULT_PROVIDERS) || {}) };
}
