import { useMemo } from "react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";

/**
 * Public catalogue: verified merchants and their live offers (RLS only
 * returns verified partners to non-admins). Offers are decorated with their
 * merchant's name/city/coordinates.
 */
const CACHE_KEY = "nelvin_catalog_v1";

export function useCatalog() {
  const { data, loading, error, reload } = useAsync(async () => {
    try {
      const [merchants, offers] = await Promise.all([
        entities.Merchant.filter({ verified_status: "VERIFIED" }, "name", 500),
        entities.Offer.list("-created_date", 500),
      ]);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ merchants, offers, at: Date.now() })); } catch { /* storage full or blocked */ }
      return { merchants, offers };
    } catch (e) {
      // Weak or no connection: show the last catalogue seen on this phone.
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (cached?.offers) return { merchants: cached.merchants || [], offers: cached.offers, offline: true, cachedAt: cached.at };
      } catch { /* corrupted cache */ }
      throw e;
    }
  }, [], { initial: { merchants: [], offers: [] } });

  const value = useMemo(() => {
    const merchantById = new Map((data?.merchants || []).map((m) => [m.id, m]));
    const now = Date.now();
    const offers = (data?.offers || [])
      .filter((o) => merchantById.has(o.merchant_id))
      .filter((o) => !o.expires_at || new Date(o.expires_at).getTime() >= now)
      .map((o) => {
        const m = merchantById.get(o.merchant_id);
        return {
          ...o,
          merchant: m,
          merchant_name: m?.name || "Partenaire",
          city: m?.city || "",
          country: m?.country || "",
          category: o.category || m?.category || "",
        };
      });
    return { merchants: data?.merchants || [], offers, merchantById, offline: !!data?.offline, cachedAt: data?.cachedAt || null };
  }, [data]);

  return { ...value, loading, error, reload };
}

/** Human label for an offer's advantage, in the viewer's currency. */
export function offerBadge(offer, format) {
  const v = Number(offer.discount_value || 0);
  switch (offer.discount_type) {
    case "PERK":
      return offer.perk_label || "Privilège offert";
    case "FIXED":
      return `-${format ? format(v) : `$${v}`}`;
    case "CASHBACK":
      return `${Math.max(v, Number(offer.cashback_rate || 0))}% cashback`;
    default:
      return `-${v}%`;
  }
}
