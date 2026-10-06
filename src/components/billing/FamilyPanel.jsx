import React, { useState } from "react";
import { Users, UserPlus, Loader2, Check, X, Heart } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import { callRpc } from "@/api/rpc";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";

/** Family membership: invite/remove people (holder), accept/leave (members). */
export default function FamilyPanel({ onChange }) {
  const { toast } = useToast();
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
      toast({ title: "Impossible", description: e.message, variant: "destructive" });
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
        ? { title: "Invitation envoyée", description: "Votre proche la verra dans son espace Abonnement." }
        : { title: "Invitation enregistrée", description: "Elle apparaîtra dès que cette personne créera son compte Nelvin avec cet email." });
    }, null);
  };

  if (!fam) return null;
  const seats = Number(fam.seats || 0);
  const used = fam.members?.length || 0;

  return (
    <SectionCard icon={Users} title="Abonnement famille" className="mt-6">
      {fam.invitations?.length > 0 && (
        <div className="mb-4 space-y-2">
          {fam.invitations.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm">
              <span className="text-emerald-900"><Heart className="mr-1 inline h-4 w-4" /> <strong>{inv.owner_name}</strong> vous invite à partager son abonnement.</span>
              <span className="flex gap-2">
                <button disabled={busy} onClick={() => run(() => callRpc("family_accept", { p_id: inv.id }), "Bienvenue dans la famille !")} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"><Check className="h-3.5 w-3.5" /> Accepter</button>
                <button disabled={busy} onClick={() => run(() => callRpc("family_remove", { p_id: inv.id }), "Invitation refusée")} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800">Refuser</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {fam.covered_by ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-slate-600">Vous profitez de l'abonnement de <strong>{fam.covered_by.owner_name}</strong> jusqu'au {new Date(fam.covered_by.expires_at).toLocaleDateString("fr-FR")}.</p>
          <button disabled={busy} onClick={() => window.confirm("Quitter cet abonnement famille ?") && run(() => callRpc("family_remove", { p_id: fam.membership_id }), "Vous avez quitté la famille")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Quitter</button>
        </div>
      ) : seats > 0 ? (
        <>
          <p className="text-sm text-slate-600">
            Votre plan inclut <strong>{seats}</strong> proche{seats > 1 ? "s" : ""} qui profite{seats > 1 ? "nt" : ""} des mêmes offres avec leur propre compte · {used}/{seats} utilisée{used > 1 ? "s" : ""}.
          </p>
          {used < seats && (
            <form onSubmit={invite} className="mt-3 flex gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@proche.com" aria-label="Email du proche" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Inviter
              </button>
            </form>
          )}
          {used > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {fam.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-700">{m.name || m.email} {m.name && <span className="text-xs text-slate-400">{m.email}</span>}</span>
                  <span className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{m.status === "ACTIVE" ? "Actif" : "Invitation envoyée"}</span>
                    <button disabled={busy} onClick={() => run(() => callRpc("family_remove", { p_id: m.id }), "Retiré de la famille")} aria-label="Retirer" className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">Partagez vos avantages avec vos proches : les plans qui incluent l'abonnement famille l'indiquent sur la page des plans.</p>
      )}
    </SectionCard>
  );
}
