import { useCallback, useEffect, useState } from "react";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";

// Shared cache so every heart on the page stays in sync.
let cache = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(new Set(cache)));

/** The signed-in member's favourite offers: { ids, isFavorite, toggle }. */
export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => new Set(cache || []));

  useEffect(() => {
    listeners.add(setIds);
    if (user?.id && cache === null) {
      cache = new Set();
      entities.Favorite.list("-created_date", 500)
        .then((rows) => { cache = new Set(rows.map((r) => r.offer_id)); emit(); })
        .catch(() => {});
    }
    return () => listeners.delete(setIds);
  }, [user?.id]);

  const toggle = useCallback(async (offerId) => {
    if (!user?.id) return false;
    const was = cache?.has(offerId);
    cache = new Set(cache || []);
    if (was) cache.delete(offerId); else cache.add(offerId);
    emit();
    try {
      if (was) await entities.Favorite.delete(offerId);
      else await entities.Favorite.create({ offer_id: offerId });
      return !was;
    } catch {
      if (was) cache.add(offerId); else cache.delete(offerId);
      emit();
      return was;
    }
  }, [user?.id]);

  return { ids, isFavorite: (id) => ids.has(id), toggle };
}
