import NvIcon from "@/components/brand/NvIcon";
import React, { useState } from "react";
import { Gift, Loader2, Copy, Check, Ticket } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import CheckoutModal from "@/components/CheckoutModal";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { usePlans } from "@/hooks/usePlans";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";

const STATUS = {
  AVAILABLE: ["bl.gift.toActivate", "bg-emerald-100 text-emerald-700"],
  REDEEMED: ["bl.gift.activated", "bg-slate-100 text-slate-600"],
  PENDING_PAYMENT: ["bl.gift.pendingPay", "bg-amber-100 text-amber-700"],
  CANCELLED: ["bl.gift.cancelled", "bg-rose-100 text-rose-700"],
};

/** Offer a membership to someone, and redeem a gift code. */
export default function GiftPanel({ initialCode = "", onRedeemed }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const money = useCurrencies();
  const { plans } = usePlans();
  const b2c = plans.filter((p) => p.audience === "B2C" && p.active !== false && Number(p.price_monthly) > 0);
  const { data: gifts, reload } = useAsync(() => entities.GiftCard.list("-created_date", 50), [], { initial: [] });
  const [form, setForm] = useState({ plan: "", cycle: "ANNUAL", email: "", name: "", message: "" });
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [copied, setCopied] = useState(null);
  const plan = b2c.find((p) => p.code === form.plan) || b2c[0];
  const price = plan ? Number(form.cycle === "ANNUAL" ? plan.price_annual : plan.price_monthly) : 0;
  const myEmail = (user?.email || "").toLowerCase();
  const bought = gifts.filter((g) => g.purchaser_id === user?.id);
  const received = gifts.filter((g) => g.purchaser_id !== user?.id && g.status === "AVAILABLE" && g.recipient_email === myEmail);

  const buyWithWallet = async () => {
    setBusy(true);
    try {
      const r = await callRpc("gift_buy_with_wallet", {
        p_plan_code: plan.code, p_cycle: form.cycle, p_recipient_email: form.email || null,
        p_recipient_name: form.name || null, p_message: form.message || null,
      });
      if (r?.ok === false) throw new Error(r.error);
      toast({ title: t("bl.gift.ready"), description: t("bl.gift.code", { code: r.gift_code }) });
      setForm({ ...form, email: "", name: "", message: "" });
      refreshUser?.();
      reload();
    } catch (e) {
      toast({ title: t("bl.gift.buyFail"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const redeem = async (value = code) => {
    setBusy(true);
    try {
      const r = await callRpc("gift_redeem", { p_code: value });
      toast({ title: t("bl.gift.activatedT"), description: t("bl.gift.validUntil", { date: new Date(r.expires_at).toLocaleDateString(locale) }) });
      setCode("");
      reload();
      onRedeemed?.();
    } catch (e) {
      toast({ title: t("bl.gift.refused"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async (g) => {
    const text = `${window.location.origin}/billing-settings?gift=${g.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(g.id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard blocked: the code stays visible */ }
  };

  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <SectionCard icon={Gift} title={t("bl.gift.give")}>
        {!plan ? <p className="text-sm text-slate-500">{t("bl.gift.noPlan")}</p> : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select value={plan.code} onChange={(e) => setForm({ ...form, plan: e.target.value })} aria-label={t("bl.gift.planAria")} className={input}>
                {b2c.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} aria-label={t("bl.gift.durAria")} className={input}>
                <option value="MONTHLY">{t("bl.gift.1m")}</option>
                <option value="ANNUAL">{t("bl.gift.1y")}</option>
              </select>
            </div>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("bl.gift.emailPh")} aria-label={t("bl.gift.emailAria")} className={input} />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("bl.gift.namePh")} aria-label={t("bl.gift.nameAria")} className={input} />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={500} rows={2} placeholder={t("bl.gift.msgPh")} aria-label={t("bl.gift.msgAria")} className={input} />
            <p className="text-xs text-slate-500">{t("bl.gift.rules")}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={buyWithWallet} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("bl.gift.wallet", { amount: money.format(price, "USD") })}
              </button>
              <button onClick={() => setCheckout(true)} disabled={busy} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t("bl.gift.payOnline")}</button>
            </div>
          </div>
        )}
        {bought.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            {bought.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-mono text-slate-900">{g.status === "PENDING_PAYMENT" ? "—" : g.code}</span>
                  <span className="ml-2 text-xs text-slate-500">{g.recipient_name || g.recipient_email || t("bl.gift.noRecipient")}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[g.status][1]}`}>{t(STATUS[g.status][0])}</span>
                  {g.status === "AVAILABLE" && (
                    <button onClick={() => copy(g)} aria-label={t("bl.gift.copyAria")} className="text-slate-400 hover:text-emerald-600">
                      {copied === g.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard icon={Ticket} title={t("bl.gift.haveCode")}>
        {received.map((g) => (
          <div key={g.id} className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-2"><NvIcon name="PERK_GIFT" className="h-5 w-5 shrink-0" /> {g.message ? t("bl.gift.offeredMsg", { msg: g.message }) : t("bl.gift.offered")}</p>
            <button onClick={() => redeem(g.code)} disabled={busy} className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white">{t("bl.gift.activateMine")}</button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); redeem(); }} className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GIFT-XXXX-XXXX-XXXX" aria-label={t("bl.gift.codeAria")} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" />
          <button type="submit" disabled={busy || code.length < 10} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t("bl.gift.activate")}</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">{t("bl.gift.stack")}</p>
      </SectionCard>

      {plan && (
        <CheckoutModal
          open={checkout}
          purpose="GIFT"
          plan={plan}
          cycle={form.cycle}
          gift={{ recipient_email: form.email, recipient_name: form.name, message: form.message }}
          onClose={() => { setCheckout(false); reload(); }}
        />
      )}
    </div>
  );
}
