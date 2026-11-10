import React, { useMemo, useState } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { Stars } from "@/components/OfferReviews";

const STATUS = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

function ReviewRow({ r, who, about, onSave }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(r.comment || "");
  const [note, setNote] = useState(r.admin_note || "");
  const [busy, setBusy] = useState(false);
  const act = async (patch) => {
    setBusy(true);
    try { await onSave(r, patch); setEditing(false); } finally { setBusy(false); }
  };
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">{who}</span> → <span className="font-medium text-slate-900">{about}</span></p>
        <div className="flex items-center gap-2">
          <Stars value={r.rating} size="h-3.5 w-3.5" />
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS[r.status]}`}>{r.status}</span>
        </div>
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} aria-label="Review text" className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Internal note (optional)" aria-label="Internal note" className="w-full rounded-lg border border-slate-300 p-2 text-sm" />
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => act({ comment: comment.trim() || null, admin_note: note.trim() || null })} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">Save correction</button>
            <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{r.comment || <em className="text-slate-400">No comment</em>}</p>
          {r.original_comment && <p className="mt-1 text-xs text-slate-400">Corrected by admin. Original: “{r.original_comment}”</p>}
          {r.admin_note && <p className="mt-1 text-xs text-slate-500">Note: {r.admin_note}</p>}
        </>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs text-slate-400">{new Date(r.created_date).toLocaleDateString()}</span>
        <span className="flex-1" />
        {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        {!editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /> Correct</button>}
        {r.status !== "REJECTED" && <button disabled={busy} onClick={() => act({ status: "REJECTED" })} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-rose-600 hover:bg-rose-50"><X className="h-3.5 w-3.5" /> Reject</button>}
        {r.status !== "APPROVED" && <button disabled={busy} onClick={() => act({ status: "APPROVED" })} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Approve</button>}
      </div>
    </li>
  );
}

/** Back-office moderation of reviews in both directions: approve, correct, reject. */
export default function AdminReviews() {
  const { toast } = useToast();
  const [tab, setTab] = useState("offer");
  const [status, setStatus] = useState("PENDING");
  const { data: offerReviews, loading: l1, reload: r1 } = useAsync(() => entities.OfferReview.list("-created_date", 300), [], { initial: [] });
  const { data: memberReviews, loading: l2, reload: r2 } = useAsync(() => entities.MemberReview.list("-created_date", 300), [], { initial: [] });
  const { data: merchants } = useAsync(() => entities.Merchant.list("-created_date", 500), [], { initial: [] });
  const { data: offers } = useAsync(() => entities.Offer.list("-created_date", 500), [], { initial: [] });
  const { data: profiles } = useAsync(() => entities.User.list("-created_date", 1000).catch(() => []), [], { initial: [] });
  const mName = useMemo(() => Object.fromEntries(merchants.map((m) => [m.id, m.name || m.business_name])), [merchants]);
  const oTitle = useMemo(() => Object.fromEntries(offers.map((o) => [o.id, o.title])), [offers]);
  const pName = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p.full_name || p.email])), [profiles]);

  const rows = tab === "offer" ? offerReviews : memberReviews;
  const counts = Object.fromEntries(["PENDING", "APPROVED", "REJECTED"].map((s) => [s, rows.filter((r) => r.status === s).length]));
  const shown = rows.filter((r) => r.status === status);

  const save = async (r, patch) => {
    try {
      const ent = tab === "offer" ? entities.OfferReview : entities.MemberReview;
      await ent.update(r.id, patch);
      (tab === "offer" ? r1 : r2)();
      toast({ title: "Review updated" });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  if ((l1 || l2) && !rows.length) return <Spinner />;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["offer", "Members → Partners"], ["member", "Partners → Members"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{label}</button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${status === s ? "border-slate-900 bg-white text-slate-900" : "border-slate-200 text-slate-500"}`}>{s} ({counts[s]})</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState title={`No ${status.toLowerCase()} reviews`} description="New reviews appear here for approval before they are public." />
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => tab === "offer"
            ? <ReviewRow key={r.id} r={r} who={r.author_name || pName[r.user_id] || "Member"} about={`${mName[r.merchant_id] || "Partner"} · ${oTitle[r.offer_id] || "offer"}`} onSave={save} />
            : <ReviewRow key={r.id} r={r} who={mName[r.merchant_id] || "Partner"} about={pName[r.user_id] || "Member"} onSave={save} />)}
        </ul>
      )}
    </div>
  );
}
