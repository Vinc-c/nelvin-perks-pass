import React, { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useI18n } from "@/i18n/I18nContext";
import { useToast } from "@/components/ui/use-toast";

/**
 * Counter PIN: lets members validate an offer on their own phone (the cashier
 * types the PIN), with no partner login at the till. Stored hashed, never shown.
 */
export default function MerchantPinCard({ merchantId }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { data: status, reload } = useAsync(() => callRpc("merchant_pin_status", merchantId ? { p_merchant_id: merchantId } : {}), [merchantId]);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (pin !== confirm) {
      toast({ title: t("mc.pin.mismatch"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await callRpc("merchant_set_pin", { p_pin: pin, ...(merchantId ? { p_merchant_id: merchantId } : {}) });
      setPin("");
      setConfirm("");
      toast({ title: t("mc.pin.savedTitle"), description: t("mc.pin.savedDesc") });
      reload();
    } catch (err) {
      toast({ title: t("mc.pin.refused"), description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-emerald-500";
  return (
    <SectionCard title={t("mc.pin.title")} icon={KeyRound}>
      <p className="text-sm text-slate-600">
        {t("mc.pin.desc")}
      </p>
      {status?.has_pin && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> {t("mc.pin.activeSince", { date: new Date(status.updated_date).toLocaleDateString(locale) })}
        </p>
      )}
      <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} required value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder={t("mc.pin.new")} aria-label={t("mc.pin.new")} autoComplete="new-password" className={input} />
        <input type="password" inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} required value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))} placeholder={t("mc.pin.confirm")} aria-label={t("mc.pin.confirmAria")} autoComplete="new-password" className={input} />
        <button type="submit" disabled={busy || pin.length < 4} className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {status?.has_pin ? t("mc.pin.change") : t("mc.pin.activate")}
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-400">{t("mc.pin.hint")}</p>
    </SectionCard>
  );
}
