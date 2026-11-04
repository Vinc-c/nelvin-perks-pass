import { useMemo } from "react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { supabase } from "@/api/supabaseClient";

/**
 * Public catalogue: verified merchants and their live offers (RLS only
 * returns verified partners to non-admins). Offers are decorated with their
 * merchant's name/city/coordinates.
 */
const CACHE_KEY = "nelvin_catalog_v1";

export function useCatalog() {
  const { data, loading, error, reload } = useAsync(async () => {
    try {
      const [merchants, offers, stats] = await Promise.all([
        entities.Merchant.filterAll({ verified_status: "VERIFIED" }, "name"),
        entities.Offer.filterAll({}, "-created_date"),
        // Ratings and usage counts feed the shelves; the catalogue still works without them.
        supabase.rpc("offer_public_stats").then(({ data: rows }) => rows || [], () => []),
      ]);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ merchants, offers, stats, at: Date.now() })); } catch { /* storage full or blocked */ }
      return { merchants, offers, stats };
    } catch (e) {
      // Weak or no connection: show the last catalogue seen on this phone.
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (cached?.offers) return { merchants: cached.merchants || [], offers: cached.offers, stats: cached.stats || [], offline: true, cachedAt: cached.at };
      } catch { /* corrupted cache */ }
      throw e;
    }
  }, [], { initial: { merchants: [], offers: [] } });

  const value = useMemo(() => {
    const merchantById = new Map((data?.merchants || []).map((m) => [m.id, m]));
    const now = Date.now();
    const statById = new Map((data?.stats || []).map((r) => [r.offer_id, r]));
    const offers = (data?.offers || [])
      .filter((o) => merchantById.has(o.merchant_id))
      .filter((o) => !o.expires_at || new Date(o.expires_at).getTime() >= now)
      .map((o) => {
        const m = merchantById.get(o.merchant_id);
        return {
          ...o,
          merchant: m,
          merchant_name: m?.name || "Partner",
          city: m?.city || "",
          country: m?.country || "",
          category: o.category || m?.category || "",
          rating_avg: statById.get(o.id)?.rating_avg != null ? Number(statById.get(o.id).rating_avg) : null,
          rating_count: statById.get(o.id)?.rating_count || 0,
          uses_30d: statById.get(o.id)?.uses_30d || 0,
          uses_total: statById.get(o.id)?.uses_total || 0,
        };
      });
    return { merchants: data?.merchants || [], offers, merchantById, offline: !!data?.offline, cachedAt: data?.cachedAt || null };
  }, [data]);

  return { ...value, loading, error, reload };
}

/** Human label for an offer's advantage, in the viewer's currency. */
export function offerBadge(offer, format, t) {
  const v = Number(offer.discount_value || 0);
  switch (offer.discount_type) {
    case "PERK":
      return offer.perk_label || (t ? t("offer.perkDefault") : "Perk included");
    case "FIXED":
      return `-${format ? format(v) : `$${v}`}`;
    case "CASHBACK":
      return t ? t("offer.cashbackBadge", { n: Math.max(v, Number(offer.cashback_rate || 0)) }) : `${Math.max(v, Number(offer.cashback_rate || 0))}% cashback`;
    default:
      return `-${v}%`;
  }
}
