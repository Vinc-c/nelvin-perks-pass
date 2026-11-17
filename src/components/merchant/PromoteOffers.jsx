import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useToast } from "@/components/ui/use-toast";
import CheckoutModal from "@/components/CheckoutModal";

const STATUS_STYLE = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ENDED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-rose-100 text-rose-700",
  STOPPED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};
const isoDay = (d) => d.toISOString().slice(0, 10);
const displayStatus = (o) => (o.status === "ACTIVE" && new Date(o.ends_at) <= new Date() ? "ENDED" : o.status);

/** Merchant: buy visibility (Home carousel, top of the offers list) for one of their offers. */
export default function PromoteOffers() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const money = useCurrencies();
  const merchantId = user?.merchant_id;
  const [placements, setPlacements] = useState([]);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ offer: "", placement: "", days: 7, start: isoDay(new Date()) });
  const [left, setLeft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(null);

  const load = useCallback(async () => {
    if (!merchantId) return;
    const [pl, off, ord] = await Promise.all([
      entities.PromoPlacement.filter({ active: true }, "sort", 20).catch(() => []),
      entities.Offer.filter({ merchant_id: merchantId }, "-created_date", 100).catch(() => []),
      entities.PromoOrder.filter({ merchant_id: merchantId }, "-created_at", 50).catch(() => []),
    ]);
    setPlacements(pl);
    setOffers(off);
    setOrders(ord);
    setForm((f) => ({ ...f, offer: f.offer || off[0]?.id || "", placement: f.placement || pl[0]?.code || "" }));
    setLoading(false);
  }, [merchantId]);
  useEffect(() => { load(); }, [load]);

  const pl = placements.find((p) => p.code === form.placement);
  const days = Math.max(1, Number(form.days) || 0);
  const priceUsd = pl ? Math.round(Number(pl.price_usd_per_day) * days * 100) / 100 : 0;
  const offerOf = (id) => offers.find((o) => o.id === id);

  useEffect(() => {
    if (!pl || !form.start) return;
    callRpc("promo_slots_left", { p_placement: pl.code, p_start: form.start, p_days: days }).then(setLeft).catch(() => setLeft(null));
  }, [pl, form.start, days]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const invalid = !pl || !form.offer || days < pl.min_days || days > pl.max_days || left === 0;

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await callRpc("create_promo_order", { p_offer: form.offer, p_placement: form.placement, p_days: days, p_start: form.start });
      setCheckout({ id: res.id, price_usd: res.price_usd, title: offerOf(form.offer)?.title || "" });
    } catch (err) {
      toast({ title: t("mb.co.failed"), description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const total = useMemo(() => (priceUsd ? `${money.format(priceUsd, "USD")} · ${money.formatIn(money.fromUsd(priceUsd, "XAF"), "XAF")}` : "—"), [priceUsd, money]);
  const dateFmt = (d) => new Date(d).toLocaleDateString(locale);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;
  return (
    <section className="space-y-5">
      <div className="rounded-[20px] border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-medium text-slate-900"><Megaphone className="h-5 w-5 text-nv-emerald" strokeWidth={1.5} /> {t("pr.title")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("pr.sub")}</p>

        {offers.length === 0 || placements.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t("pr.noOffers")}</p>
        ) : (
          <form onSubmit={start} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">{t("pr.offer")}
              <select value={form.offer} onChange={set("offer")} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                {offers.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-slate-700">{t("pr.placement")}</legend>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {placements.map((p) => (
                  <label key={p.code} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${form.placement === p.code ? "border-nv-emerald bg-nv-emerald/5 ring-1 ring-nv-emerald" : "border-slate-200 hover:border-slate-300"}`}>
                    <input type="radio" name="placement" value={p.code} checked={form.placement === p.code} onChange={set("placement")} className="sr-only" />
                    <span className="block font-medium text-slate-900">{p.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{p.description}</span>
                    <span className="mt-2 block text-sm font-medium text-nv-emerald">{t("pr.perDay", { price: money.format(Number(p.price_usd_per_day), "USD") })}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="text-sm font-medium text-slate-700">{t("pr.days")}
              <input type="number" min={pl?.min_days || 1} max={pl?.max_days || 30} value={form.days} onChange={set("days")} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
              {pl && <span className="mt-1 block text-xs font-normal text-slate-500">{pl.min_days}–{pl.max_days}</span>}
            </label>
            <label className="text-sm font-medium text-slate-700">{t("pr.start")}
              <input type="date" min={isoDay(new Date())} value={form.start} onChange={set("start")} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <div>
                <p className="text-xs text-slate-500">{t("pr.total")}</p>
                <p className="text-lg font-medium tabular-nums text-slate-900">{total}</p>
                {left !== null && <p className={`mt-0.5 text-xs ${left === 0 ? "text-rose-600" : "text-slate-500"}`}>{left === 0 ? t("pr.full") : t("pr.slotsLeft", { n: left })}</p>}
              </div>
              <button type="submit" disabled={busy || invalid} className="flex h-11 items-center gap-2 rounded-xl bg-nv-emerald px-6 text-sm font-medium text-white disabled:opacity-40">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("pr.continue")}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-[20px] border border-slate-200 bg-white p-5">
        <h3 className="text-base font-medium text-slate-900">{t("pr.history")}</h3>
        {orders.length === 0 ? <p className="mt-3 text-sm text-slate-500">{t("pr.none")}</p> : (
          <ul className="mt-2 divide-y divide-slate-100">
            {orders.map((o) => {
              const st = displayStatus(o);
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{offerOf(o.offer_id)?.title || "—"}</p>
                    <p className="text-xs text-slate-500">{placements.find((p) => p.code === o.placement)?.name || o.placement} · {dateFmt(o.starts_at)} → {dateFmt(o.ends_at)} · {money.format(Number(o.price_usd), "USD")}</p>
                    {o.admin_note && <p className="mt-0.5 text-xs text-rose-600">{o.admin_note}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[st]}`}>{t(`pr.st.${st}`)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {checkout && <CheckoutModal open purpose="PROMOTION" promo={checkout} onClose={() => { setCheckout(null); load(); }} />}
    </section>
  );
}
