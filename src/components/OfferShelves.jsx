import React, { useMemo } from "react";
import { Flame, ThumbsUp, Sparkles } from "lucide-react";
import OfferShelf from "@/components/OfferShelf";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/lib/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/I18nContext";
import { categoryAffinity, newOffers, recommendedOffers, trendingOffers } from "@/lib/offerShelves";

/** Trending, Recommended and New-at-Nelvin shelves for the member / employee dashboards. */
export default function OfferShelves({ offers, meta, format, onRedeem, ctaLabel }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { ids: favoriteIds } = useFavorites();
  const { data: redeemed } = useAsync(
    () => (user?.id ? entities.Redemption.filter({ user_id: user.id, status: "REDEEMED" }, "-redeemed_at", 200) : Promise.resolve([])),
    [user?.id],
    { initial: [] },
  );

  const shelves = useMemo(() => {
    const byId = new Map(offers.map((o) => [o.id, o]));
    const affinity = categoryAffinity(
      (redeemed || []).map((r) => byId.get(r.offer_id)?.category),
      [...favoriteIds].map((id) => byId.get(id)),
    );
    const trending = trendingOffers(offers, 8);
    const recommended = recommendedOffers(offers, { affinity, favoriteIds, exclude: new Set(trending.slice(0, 3).map((o) => o.id)) }, 8);
    const fresh = newOffers(offers, 8);
    return { trending, recommended, fresh };
  }, [offers, redeemed, favoriteIds]);

  if (offers.length === 0) return null;
  const common = { meta, format, onRedeem, ctaLabel };
  return (
    <>
      <OfferShelf {...common} icon={Flame} eyebrow={t("shelf.trending.eyebrow")} title={t("shelf.trending.title")} offers={shelves.trending}
        badgeFor={(o) => (o.uses_30d > 0 ? t("shelf.trending.uses", { n: o.uses_30d }) : t("shelf.trending.popular"))} />
      <OfferShelf {...common} icon={ThumbsUp} eyebrow={t("shelf.recommended.eyebrow")} title={t("shelf.recommended.title")} offers={shelves.recommended}
        badgeFor={(o) => (o.rating_count > 0 && o.rating_avg >= 4.5 ? t("shelf.recommended.top") : null)} />
      <OfferShelf {...common} icon={Sparkles} eyebrow={t("shelf.new.eyebrow")} title={t("shelf.new.title")} offers={shelves.fresh}
        badgeFor={() => t("shelf.new.badge")} />
    </>
  );
}
