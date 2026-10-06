import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { invokeFunction } from "@/api/functions";
import { getCurrentUser } from "@/api/auth";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Trash2, Loader2, Crown } from "lucide-react";

const MIN_ADMINS = 2;

export default function AdminStaffManagement() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, meUser] = await Promise.all([
        entities.User.filter({ role: ["SUPER_ADMIN", "admin"] }, "created_date"),
        getCurrentUser(),
      ]);
      setAdmins(list);
      setMe(meUser);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const found = await entities.User.filter({ email: email.trim().toLowerCase() });
      if (found.length > 0) {
        const u = found[0];
        if (u.role === "SUPER_ADMIN" || u.role === "admin") {
          toast({ title: "Already a super admin", description: email });
        } else {
          await entities.User.update(u.id, { role: "SUPER_ADMIN" });
          toast({ title: "Promoted to super admin", description: email });
          setEmail("");
          await load();
        }
      } else {
        await invokeFunction("admin-invite-user", { email: email.trim(), redirect_to: window.location.origin + "/app" });
        toast({
          title: "Invitation sent",
          description: `${email} must register first, then promote them to super admin.`,
        });
        setEmail("");
      }
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (u) => {
    if (admins.length <= MIN_ADMINS) {
      toast({
        title: "Cannot remove",
        description: `At least ${MIN_ADMINS} super admins must remain.`,
        variant: "destructive",
      });
      return;
    }
    if (me && u.id === me.id) {
      toast({
        title: "Cannot remove",
        description: "You cannot remove yourself.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      // Demote rather than delete: the account and its history stay intact.
      await entities.User.update(u.id, { role: "MEMBER" });
      toast({ title: "Super admin removed", description: u.email });
      await load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Crown className="h-5 w-5 text-amber-500" /> Super Admin Staff
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Manage super admin accounts. The last two super admins are protected and cannot be removed.
        </p>
        <form onSubmit={addAdmin} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="new.admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Button type="submit" disabled={busy} className="h-11 gap-2">
            <UserPlus className="h-4 w-4" /> Add super admin
          </Button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          If the email is already registered, they are promoted instantly. Otherwise an invitation is sent.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="p-4 font-medium">Super admin</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((u) => {
                const locked = admins.length <= MIN_ADMINS || (me && u.id === me.id);
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-slate-900">{u.email}</span>
                        {me && u.id === me.id && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">You</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {u.created_date ? new Date(u.created_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeAdmin(u)}
                        disabled={busy || locked}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                          locked
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "bg-rose-100 text-rose-600 hover:bg-rose-200"
                        }`}
                        title={locked ? "Protected" : "Remove"}
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
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