import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState, Spinner } from "@/components/UiFeedback";

const STATUS = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-rose-100 text-rose-700",
  STOPPED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};
const shown = (o) => (o.status === "ACTIVE" && new Date(o.ends_at) <= new Date() ? "ENDED" : o.status);
const usd = (n) => `$${Number(n || 0).toFixed(2)}`;
const day = (d) => new Date(d).toLocaleDateString();

function PlacementRow({ p, onSaved }) {
  const { toast } = useToast();
  const [f, setF] = useState(p);
  const [busy, setBusy] = useState(false);
  const dirty = ["price_usd_per_day", "min_days", "max_days", "max_slots", "active"].some((k) => String(f[k]) !== String(p[k]));
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    try {
      await entities.PromoPlacement.update(p.code, {
        price_usd_per_day: Number(f.price_usd_per_day), min_days: Number(f.min_days), max_days: Number(f.max_days), max_slots: Number(f.max_slots), active: !!f.active, updated_date: new Date().toISOString(),
      });
      toast({ title: "Tariff saved" });
      onSaved();
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const input = "mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm";
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-medium text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.description}</p></div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> On sale</label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs text-slate-500">Price / day (USD)<input type="number" min="0" step="0.5" value={f.price_usd_per_day} onChange={num("price_usd_per_day")} className={input} /></label>
        <label className="text-xs text-slate-500">Min days<input type="number" min="1" value={f.min_days} onChange={num("min_days")} className={input} /></label>
        <label className="text-xs text-slate-500">Max days<input type="number" min="1" value={f.max_days} onChange={num("max_days")} className={input} /></label>
        <label className="text-xs text-slate-500">Slots at once<input type="number" min="1" value={f.max_slots} onChange={num("max_slots")} className={input} /></label>
      </div>
      {dirty && <button onClick={save} disabled={busy} className="mt-3 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save tariff</button>}
    </li>
  );
}

/** Super admin: promotion tariffs, approval mode, orders and revenue. */
export default function AdminPromotions() {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [placements, orders, merchants, offers, setting] = await Promise.all([
      entities.PromoPlacement.filter({}, "sort", 20),
      entities.PromoOrder.filter({}, "-created_at", 300),
      entities.Merchant.filter({}, "name", 500),
      entities.Offer.filter({}, "-created_date", 500),
      entities.PlatformSetting.get("promo_requires_review").catch(() => null),
    ]);
    return { placements, orders, merchants, offers, review: setting?.value === true };
  }, []);

  if (loading || !data) return <Spinner />;
  const name = (id) => data.merchants.find((m) => m.id === id)?.name || "—";
  const title = (id) => data.offers.find((o) => o.id === id)?.title || "—";
  const paid = data.orders.filter((o) => ["ACTIVE", "IN_REVIEW", "STOPPED"].includes(o.status));
  const revenue = paid.reduce((s, o) => s + Number(o.price_usd), 0);
  const live = data.orders.filter((o) => shown(o) === "ACTIVE").length;
  const pending = data.orders.filter((o) => o.status === "IN_REVIEW");

  const toggleReview = async (on) => {
    try {
      await entities.PlatformSetting.update("promo_requires_review", { value: on });
      reload();
    } catch (e) {
      toast({ title: "Could not change the setting", description: e.message, variant: "destructive" });
    }
  };
  const act = async (o, decision) => {
    const note = decision === "APPROVE" ? null : window.prompt(decision === "STOP" ? "Reason for stopping (shown to the partner):" : "Reason for rejecting (shown to the partner). Remember to refund them through the PSP:") ;
    if (decision !== "APPROVE" && note === null) return;
    setBusyId(o.id);
    try {
      await callRpc("review_promo_order", { p_id: o.id, p_decision: decision, p_note: note });
      reload();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Promotion revenue", usd(revenue)], ["Live now", live], ["Waiting for approval", pending.length]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{l}</p><p className="mt-1 text-2xl font-medium tabular-nums text-slate-900">{v}</p></div>
        ))}
      </div>

      <section>
        <h2 className="mb-2 text-base font-medium text-slate-900">Tariffs</h2>
        <ul className="space-y-3">{data.placements.map((p) => <PlacementRow key={`${p.code}-${p.updated_date}`} p={p} onSaved={reload} />)}</ul>
        <label className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" checked={data.review} onChange={(e) => toggleReview(e.target.checked)} />
          <span><span className="font-medium text-slate-900">Approve each promotion before it goes live.</span><br /><span className="text-xs text-slate-500">Off: a promotion starts as soon as the payment is confirmed. On: it waits in the list below for your approval.</span></span>
        </label>
      </section>

      <section>
        <h2 className="mb-2 text-base font-medium text-slate-900">Orders</h2>
        {data.orders.length === 0 ? <EmptyState title="No promotion yet" description="Orders appear here as soon as a partner starts a purchase." /> : (
          <ul className="space-y-2">
            {data.orders.map((o) => {
              const st = shown(o);
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{name(o.merchant_id)} · {title(o.offer_id)}</p>
                    <p className="text-xs text-slate-500">{o.placement} · {day(o.starts_at)} → {day(o.ends_at)} · {usd(o.price_usd)}{o.admin_note ? ` · ${o.admin_note}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[st]}`}>{st.replace("_", " ")}</span>
                    {o.status === "IN_REVIEW" && <button disabled={busyId === o.id} onClick={() => act(o, "APPROVE")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Approve</button>}
                    {["IN_REVIEW", "ACTIVE"].includes(o.status) && st !== "ENDED" && <button disabled={busyId === o.id} onClick={() => act(o, o.status === "ACTIVE" ? "STOP" : "REJECT")} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50">{o.status === "ACTIVE" ? "Stop" : "Reject"}</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
