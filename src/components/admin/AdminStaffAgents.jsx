import React, { useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { invokeFunction } from "@/api/functions";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { STAFF_ROLES } from "@/lib/roles";
import { BadgeCheck, Clock, Mail, Trash2, UserPlus, Users } from "lucide-react";

const ROLE_KEYS = Object.keys(STAFF_ROLES);

/**
 * Nelvin agents: scoped back-office accounts. A role grants only its own area (images & marketing, payouts,
 * support, promotions); the database enforces it, so an agent can never reach another area even by calling the API.
 */
export default function AdminStaffAgents() {
  const { toast } = useToast();
  const { data: rows, loading, reload } = useAsync(async () => {
    const list = await entities.StaffMember.list("created_date", 200);
    const emails = list.map((r) => r.email);
    const { data: profs } = emails.length ? await supabase.from("profiles").select("email, full_name").in("email", emails) : { data: [] };
    const byEmail = Object.fromEntries((profs || []).map((p) => [String(p.email).toLowerCase(), p]));
    return list.map((r) => ({ ...r, joined: !!byEmail[r.email], full_name: byEmail[r.email]?.full_name }));
  }, [], { initial: [] });
  const agents = Array.isArray(rows) ? rows : [];
  const [form, setForm] = useState({ email: "", staff_role: "MARKETING", note: "", invite: true });
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    try {
      await entities.StaffMember.create({ email, staff_role: form.staff_role, note: form.note.trim() || null });
      const joined = agents.some((a) => a.email === email && a.joined);
      if (form.invite && !joined) {
        try {
          await invokeFunction("admin-invite-user", { email, redirect_to: `${window.location.origin}/app` });
          toast({ title: "Agent added", description: `Invitation sent to ${email}. The role applies at signup.` });
        } catch (err) {
          toast({ title: "Added, invitation not sent", description: err.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Agent added", description: email });
      }
      setForm({ email: "", staff_role: "MARKETING", note: "", invite: true });
      reload();
    } catch (err) {
      toast({ title: "Unable to add", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (a, staff_role) => {
    try {
      await entities.StaffMember.update(a.email, { staff_role });
      toast({ title: "Role updated", description: `${a.email} is now ${STAFF_ROLES[staff_role].label}` });
      reload();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove agent access for ${a.email}?`)) return;
    setBusy(true);
    try {
      await entities.StaffMember.delete(a.email);
      toast({ title: "Access removed", description: a.email });
      reload();
    } catch (err) {
      toast({ title: "Unable to remove", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const input = "h-11 rounded-lg border border-slate-200 px-3 text-sm";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Users className="h-5 w-5 text-nv-emerald" /> Nelvin agents</h3>
        <p className="mt-1 text-sm text-slate-500">
          Give a team member access to one area only. Agents must use a dedicated email (not a merchant, HR or employee account) and enable two-factor authentication.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ROLE_KEYS.map((k) => (
            <li key={k} className="rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold text-slate-900">{STAFF_ROLES[k].label}</span><span className="block text-slate-500">{STAFF_ROLES[k].desc}</span></li>
          ))}
        </ul>
        <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1.2fr_0.8fr_1fr_auto]">
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="agent@example.com" aria-label="Email" className={input} />
          <select value={form.staff_role} onChange={(e) => setForm({ ...form, staff_role: e.target.value })} aria-label="Role" className={input}>
            {ROLE_KEYS.map((k) => <option key={k} value={k}>{STAFF_ROLES[k].label}</option>)}
          </select>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (name, team…)" aria-label="Note" className={input} />
          <button type="submit" disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50"><UserPlus className="h-4 w-4" /> Add</button>
        </form>
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={form.invite} onChange={(e) => setForm({ ...form, invite: e.target.checked })} className="accent-nv-emerald" />
          Send an email invitation if the person doesn't have an account yet
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading && !agents.length ? <Spinner /> : agents.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No agents yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-slate-500"><th className="p-4 font-medium">Agent</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Status</th><th className="p-4" /></tr></thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.email} className="border-b border-slate-50 last:border-0">
                  <td className="p-4"><p className="font-medium text-slate-900">{a.full_name || a.email}</p>{a.full_name && <p className="text-xs text-slate-500">{a.email}</p>}{a.note && <p className="text-xs text-slate-400">{a.note}</p>}</td>
                  <td className="p-4">
                    <select value={a.staff_role} onChange={(e) => changeRole(a, e.target.value)} aria-label={`Role of ${a.email}`} className="h-9 rounded-lg border border-slate-200 px-2 text-sm">
                      {ROLE_KEYS.map((k) => <option key={k} value={k}>{STAFF_ROLES[k].label}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    {a.joined
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><BadgeCheck className="h-3 w-3" /> Active</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"><Clock className="h-3 w-3" /> Awaiting signup</span>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!a.joined && <button onClick={() => invokeFunction("admin-invite-user", { email: a.email, redirect_to: `${window.location.origin}/app` }).then(() => toast({ title: "Invitation resent" }), (err) => toast({ title: "Error", description: err.message, variant: "destructive" }))} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"><Mail className="h-3 w-3" /> Invite</button>}
                      <button onClick={() => remove(a)} disabled={busy} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 disabled:opacity-40"><Trash2 className="h-3 w-3" /> Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
