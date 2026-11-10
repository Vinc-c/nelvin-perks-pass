import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { Stars } from "@/components/OfferReviews";

/** Partner rates the customer of a redeemed offer (private, moderated by the back-office). */
export default function RateMember({ redemption, merchantId, review, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(review?.rating || 0);
  const [comment, setComment] = useState(review?.comment || "");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setBusy(true);
    try {
      const body = { rating, comment: comment.trim() || null };
      if (review) await entities.MemberReview.update(review.id, body);
      else await entities.MemberReview.create({ ...body, merchant_id: merchantId, user_id: redemption.user_id, redemption_id: redemption.id });
      toast({ title: t("rv.submitted") });
      setOpen(false);
      onSaved?.();
    } catch (err) {
      toast({ title: t("mb.reviews.failed"), description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!redemption.user_id) return null;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-emerald-700 hover:underline">
        {review ? `${t("rv.rated")} · ${review.status === "PENDING" ? t("rv.pending") : review.status === "REJECTED" ? t("rv.rejected") : t("rv.approved")}` : t("rv.rateCustomer")}
      </button>
    );
  }
  return (
    <form onSubmit={save} className="mt-2 space-y-2 rounded-lg bg-white p-3 text-start ring-1 ring-slate-200">
      <Stars value={rating} size="h-6 w-6" onChange={setRating} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={2} aria-label={t("mb.reviews.comment")} placeholder={t("rv.customerPlaceholder")} className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !rating} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">{t("mb.reviews.publish")}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">{t("rv.cancel")}</button>
      </div>
      <p className="text-[11px] text-slate-400">{t("rv.privateNote")}</p>
    </form>
  );
}
