import React, { useState } from "react";
import { Users, UserPlus, Loader2, Check, X, Heart } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";

/** Family membership: invite/remove people (holder), accept/leave (members). */
export default function FamilyPanel({ onChange }) {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { data: fam, reload } = useAsync(() => callRpc("my_family"), []);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn, okTitle) => {
    setBusy(true);
    try {
      await fn();
      if (okTitle) toast({ title: okTitle });
      await reload();
      onChange?.();
    } catch (e) {
      toast({ title: t("bl.fam.fail"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const invite = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await callRpc("family_invite", { p_email: email });
      setEmail("");
      toast(r?.has_account
        ? { title: t("bl.fam.sent"), description: t("bl.fam.sentDesc") }
        : { title: t("bl.fam.saved"), description: t("bl.fam.savedDesc") });
    }, null);
  };

  if (!fam) return null;
  const seats = Number(fam.seats || 0);
  const used = fam.members?.length || 0;

  return (
    <SectionCard icon={Users} title={t("bl.fam.title")} className="mt-6">
      {fam.invitations?.length > 0 && (
        <div className="mb-4 space-y-2">
          {fam.invitations.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm">
              <span className="text-emerald-900"><Heart className="mr-1 inline h-4 w-4" /> {t("bl.fam.invites", { name: inv.owner_name }).split(/<\/?b>/).map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}</span>
              <span className="flex gap-2">
                <button disabled={busy} onClick={() => run(() => callRpc("family_accept", { p_id: inv.id }), t("bl.fam.welcome"))} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"><Check className="h-3.5 w-3.5" /> {t("bl.fam.accept")}</button>
                <button disabled={busy} onClick={() => run(() => callRpc("family_remove", { p_id: inv.id }), t("bl.fam.declined"))} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800">{t("bl.fam.decline")}</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {fam.covered_by ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-600">{t("bl.fam.covered", { name: fam.covered_by.owner_name, date: new Date(fam.covered_by.expires_at).toLocaleDateString(locale) }).split(/<\/?b>/).map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}</p>
          <button disabled={busy} onClick={() => window.confirm(t("bl.fam.confirmLeave")) && run(() => callRpc("family_remove", { p_id: fam.membership_id }), t("bl.fam.left"))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">{t("bl.fam.leave")}</button>
        </div>
      ) : seats > 0 ? (
        <>
          <p className="text-sm text-slate-600">
            {t(seats === 1 ? "bl.fam.seats.one" : "bl.fam.seats.other", { n: seats, used }).split(/<\/?b>/).map((s, i) => (i % 2 ? <strong key={i}>{s}</strong> : s))}
          </p>
          {used < seats && (
            <form onSubmit={invite} className="mt-3 flex gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("bl.fam.emailPh")} aria-label={t("bl.fam.emailAria")} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} {t("bl.fam.invite")}
              </button>
            </form>
          )}
          {used > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {fam.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-700">{m.name || m.email} {m.name && <span className="text-xs text-slate-400">{m.email}</span>}</span>
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{m.status === "ACTIVE" ? t("bl.fam.active") : t("bl.fam.inviteSent")}</span>
                    <button disabled={busy} onClick={() => run(() => callRpc("family_remove", { p_id: m.id }), t("bl.fam.removed"))} aria-label={t("bl.fam.remove")} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">{t("bl.fam.none")}</p>
      )}
    </SectionCard>
  );
}
