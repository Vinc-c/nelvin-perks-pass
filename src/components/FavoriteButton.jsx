import React from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/lib/AuthContext";

/** Heart toggle for an offer (hidden for visitors). */
export default function FavoriteButton({ offerId, className = "" }) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  if (!user) return null;
  const on = isFavorite(offerId);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(offerId); }}
      aria-pressed={on}
      aria-label={on ? "Remove from favorites" : "Add to favorites"}
      title={on ? "Remove from favorites" : "Add to favorites"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${className}`}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
    </button>
  );
}
