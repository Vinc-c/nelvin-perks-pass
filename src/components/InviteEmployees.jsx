import React, { useState, useEffect, useCallback } from "react";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, Copy, Check, RefreshCw, Trash2, Mail, Loader2, KeyRound } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => {
  let s = "";
  for (let i = 0; i < 6; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `NEL-${s}`;
};

export default function InviteEmployees() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [codes, setCodes] = useState([]);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const res = await entities.InviteCode.filter({ status: "PENDING" }, "-created_date", 50);
      setCodes(Array.isArray(res) ? res : []);
    } catch {
      setCodes([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!user?.company_id) {
      toast({ title: "No company linked", description: "Your HR account isn't linked to a company.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const code = genCode();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await entities.InviteCode.create({
        company_id: user.company_id,
        code,
        target_email: email.trim() || null,
        target_name: name.trim() || null,
        role,
        status: "PENDING",
        expires_at: expiresAt,
      });
      toast({ title: "Invite code generated", description: `Share ${code} with your employee.` });
      setEmail(""); setName("");
      await load();
    } catch (err) {
      toast({ title: "Failed to generate", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = (code) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 1500); };

  const revoke = async (id) => {
    try {
      await entities.InviteCode.update(id, { status: "REVOKED" });
      await load();
      toast({ title: "Invite revoked" });
    } catch (err) {
      toast({ title: "Failed to revoke", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><UserPlus className="h-5 w-5 text-emerald-600" /> Invite employees</h3>
      <p className="mt-1 text-sm text-slate-500">Generate a one-time code. The employee joins at <span className="font-mono text-slate-700">/join</span> by entering the code + their email & password.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Employee name (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Employee email (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none">
          <option value="EMPLOYEE">Employee</option>
          <option value="HR_ADMIN">HR Admin</option>
        </select>
      </div>
      <button onClick={generate} disabled={loading} className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Generate invite code
      </button>

      {/* Active codes */}
      <div className="mt-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Pending codes</h4>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
      <div className="mt-2 space-y-2">
        {fetching ? (
          <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading codes…</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-slate-400">No pending invite codes. Generate one above.</p>
        ) : (
          codes.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-slate-900 ring-1 ring-slate-200">{c.code}</span>
                <div>
                  {c.target_email ? <p className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {c.target_email}</p> : <p className="text-xs text-slate-400">Open code (any email)</p>}
                  <p className="text-[11px] text-slate-400">Expires {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"} · {c.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(c.code)} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy
                </button>
                <button onClick={() => revoke(c.id)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Revoke</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}