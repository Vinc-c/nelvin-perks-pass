import React, { useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { isAdmin } from "@/lib/roles";

export function Stars({ value = 0, size = "h-4 w-4", onChange }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Star className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="p-0.5">{icon}</button>
        ) : <span key={n}>{icon}</span>;
      })}
    </span>
  );
}

/** Verified reviews: only members who used the offer can post (enforced by RLS). */
export default function OfferReviews({ offerId, canReview }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews, reload } = useAsync(() => entities.OfferReview.filter({ offer_id: offerId }, "-created_date", 100), [offerId], { initial: [] });
  const mine = reviews.find((r) => r.user_id === user?.id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const visible = reviews.filter((r) => !r.hidden);
  const avg = visible.length ? visible.reduce((s, r) => s + r.rating, 0) / visible.length : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    try {
      if (mine) await entities.OfferReview.update(mine.id, { rating, comment: comment.trim() || null });
      else await entities.OfferReview.create({ offer_id: offerId, rating, comment: comment.trim() || null });
      toast({ title: "Merci pour votre avis !" });
      setRating(0);
      setComment("");
      reload();
    } catch (err) {
      toast({ title: "Avis impossible", description: /row-level security/.test(err.message) ? "Seuls les membres ayant utilisé cette offre peuvent laisser un avis." : err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const moderate = async (r, patch) => {
    try {
      if (patch === "delete") await entities.OfferReview.delete(r.id);
      else await entities.OfferReview.update(r.id, patch);
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">Avis des membres</h3>
        {visible.length > 0 && <span className="flex items-center gap-1.5 text-sm text-slate-600"><Stars value={avg} /> {avg.toFixed(1)} · {visible.length}</span>}
      </div>

      {canReview && (
        <form onSubmit={submit} className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
          <p className="text-sm text-slate-600">{mine ? "Modifier votre avis" : "Vous avez utilisé cette offre : qu'en avez-vous pensé ?"}</p>
          <Stars value={rating || mine?.rating || 0} size="h-6 w-6" onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={2} placeholder={mine?.comment || "Votre commentaire (facultatif)"} aria-label="Commentaire" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !rating} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Publier
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Aucun avis pour l'instant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className={`border-b border-slate-100 pb-3 last:border-0 ${r.hidden ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{r.author_name || "Membre"} <span className="ml-1 text-xs font-normal text-emerald-600">✓ Achat vérifié</span></span>
                <Stars value={r.rating} size="h-3.5 w-3.5" />
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span>{new Date(r.created_date).toLocaleDateString("fr-FR")}</span>
                {isAdmin(user) && (
                  <>
                    <button onClick={() => moderate(r, { hidden: !r.hidden })} className="hover:underline">{r.hidden ? "Réafficher" : "Masquer"}</button>
                    <button onClick={() => moderate(r, "delete")} className="flex items-center gap-1 text-rose-500 hover:underline"><Trash2 className="h-3 w-3" /> Supprimer</button>
                  </>
                )}
                {r.user_id === user?.id && !isAdmin(user) && <button onClick={() => moderate(r, "delete")} className="hover:underline">Supprimer</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
