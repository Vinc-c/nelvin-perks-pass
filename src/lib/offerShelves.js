// Picks the offers shown in the Trending / Recommended / New shelves.
// Inputs are catalogue offers already decorated with rating_avg, rating_count,
// uses_30d, uses_total (see useCatalog) and created_date.

const DAY = 86400000;

/** Most used over the last 30 days; falls back to all-time use, then rating. */
export function trendingOffers(offers, limit = 8) {
  return offers
    .filter((o) => o.uses_30d > 0 || o.uses_total > 0)
    .sort((a, b) => (b.uses_30d - a.uses_30d) || (b.uses_total - a.uses_total) || ((b.rating_avg || 0) - (a.rating_avg || 0)))
    .slice(0, limit);
}

/** Added in the last 14 days (newest first); if nothing is that recent, the newest few. */
export function newOffers(offers, limit = 8, now = Date.now()) {
  const byDate = [...offers].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const fresh = byDate.filter((o) => now - new Date(o.created_date).getTime() <= 14 * DAY);
  return (fresh.length ? fresh : byDate).slice(0, limit);
}

/**
 * Personal picks: categories the member already used or saved weigh most, then
 * rating quality and featured offers. `affinity` maps category -> count.
 * Offers already shown elsewhere can be excluded with `exclude` (Set of ids).
 */
export function recommendedOffers(offers, { affinity = {}, favoriteIds = new Set(), exclude = new Set() } = {}, limit = 8) {
  const score = (o) => {
    const rating = o.rating_count > 0 ? (o.rating_avg || 0) : 3.5; // unrated: neutral, not penalised
    const confidence = Math.min(o.rating_count, 10) / 10;
    return (affinity[o.category] || 0) * 3
      + (favoriteIds.has(o.id) ? 0 : 0.5)
      + (o.is_featured ? 2 : 0)
      + (rating - 3.5) * (1 + confidence * 2)
      + Math.min(o.uses_30d || 0, 20) * 0.1;
  };
  return offers
    .filter((o) => !exclude.has(o.id))
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.o);
}

/** category -> number of times the member used or favourited an offer in it. */
export function categoryAffinity(redeemedCategories = [], favoriteOffers = []) {
  const out = {};
  for (const c of redeemedCategories) if (c) out[c] = (out[c] || 0) + 2;
  for (const o of favoriteOffers) if (o?.category) out[o.category] = (out[o.category] || 0) + 1;
  return out;
}
