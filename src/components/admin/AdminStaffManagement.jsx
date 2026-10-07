import React, { useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { invokeFunction } from "@/api/functions";
import { useAuth } from "@/lib/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Shield, UserPlus, Trash2, Crown, Mail, Clock } from "lucide-react";

const MIN_ADMINS = 2;

/**
 * Super admin allowlist. `platform_admins` is the only source of the
 * SUPER_ADMIN role: adding an email promotes the account now (or at signup),
 * removing it demotes the account. The database refuses to go below two
 * super admins and refuses self-removal.
 */
export default function AdminStaffManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: adminRows, loading, reload } = useAsync(() => callRpc("admin_staff_list"), [], { initial: [] });
  const admins = Array.isArray(adminRows) ? adminRows : [];
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const myEmail = (user?.email || "").toLowerCase();

  const add = async (e) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    if (admins.some((a) => a.email === clean)) {
      toast({ title: "Déjà super admin", description: clean });
      return;
    }
    setBusy(true);
    try {
      await entities.PlatformAdmin.create({ email: clean, note: note.trim() || null });
      const row = ((await callRpc("admin_staff_list")) || []).find((a) => a.email === clean);
      if (row && !row.joined && invite) {
        try {
          await invokeFunction("admin-invite-user", { email: clean, redirect_to: `${window.location.origin}/app` });
          toast({ title: "Super admin ajouté", description: `Invitation envoyée à ${clean}. Le rôle s'applique à l'inscription.` });
        } catch (err) {
          toast({ title: "Ajouté, invitation non envoyée", description: err.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Super admin ajouté", description: row?.joined ? `${clean} est promu immédiatement.` : `Le rôle s'appliquera dès l'inscription de ${clean}.` });
      }
      setEmail("");
      setNote("");
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Retirer l'accès super admin de ${a.email} ?`)) return;
    setBusy(true);
    try {
      await entities.PlatformAdmin.delete(a.email);
      toast({ title: "Accès retiré", description: a.email });
      reload();
    } catch (err) {
      toast({ title: "Impossible", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Crown className="h-5 w-5 text-amber-500" /> Super admins
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Liste d'accès de la plateforme. Ajoutez autant d'adresses que nécessaire ; au moins {MIN_ADMINS} super admins restent toujours actifs
          et personne ne peut se retirer soi-même. La double authentification (2FA) est exigée dès qu'un admin l'a activée.
        </p>
        <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nouvel.admin@exemple.com" aria-label="Email" className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (rôle, équipe…)" aria-label="Note" className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
          <button type="submit" disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> Ajouter
          </button>
        </form>
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} className="accent-emerald-500" />
          Envoyer une invitation par email si la personne n'a pas encore de compte
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && !admins.length ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Super admin</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium">Ajouté le</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const self = a.email === myEmail;
                const locked = self || admins.length <= MIN_ADMINS;
                return (
                  <tr key={a.email} className="border-b border-slate-50 last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium text-slate-900">{a.full_name || a.email}{self && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Vous</span>}</p>
                          {a.full_name && <p className="text-xs text-slate-500">{a.email}</p>}
                          {a.note && <p className="text-xs text-slate-400">{a.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {a.joined
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><Shield className="h-3 w-3" /> Actif</span>
                        : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"><Clock className="h-3 w-3" /> En attente d'inscription</span>}
                    </td>
                    <td className="p-4 text-slate-500">{a.created_date ? new Date(a.created_date).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!a.joined && (
                          <button onClick={() => invokeFunction("admin-invite-user", { email: a.email, redirect_to: `${window.location.origin}/app` }).then(() => toast({ title: "Invitation renvoyée" }), (err) => toast({ title: "Erreur", description: err.message, variant: "destructive" }))} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                            <Mail className="h-3 w-3" /> Inviter
                          </button>
                        )}
                        <button onClick={() => remove(a)} disabled={busy || locked} title={self ? "Vous ne pouvez pas vous retirer" : locked ? `Minimum ${MIN_ADMINS} super admins` : "Retirer"} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${locked ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-rose-100 text-rose-600 hover:bg-rose-200"}`}>
                          <Trash2 className="h-3 w-3" /> Retirer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
