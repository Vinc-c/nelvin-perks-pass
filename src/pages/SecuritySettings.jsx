import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { useAuth } from "@/lib/AuthContext";
import { signInWithPassword, updatePassword } from "@/api/auth";
import { Shield, Lock, KeyRound, Monitor, Smartphone, Tablet, LogOut, Eye, EyeOff, Check, Trash2 } from "lucide-react";

const sessions = [
  { id: "s1", device: "MacBook Pro", icon: Monitor, location: "Dubai, UAE", ip: "94.205.x.x", current: true, last: "Active now" },
  { id: "s2", device: "iPhone 15", icon: Smartphone, location: "Dubai, UAE", ip: "94.205.x.x", current: false, last: "2 hours ago" },
  { id: "s3", device: "iPad Air", icon: Tablet, location: "Nairobi, Kenya", ip: "102.22.x.x", current: false, last: "3 days ago" },
];

export default function SecuritySettings() {
  const [twoFA, setTwoFA] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [showCodes, setShowCodes] = useState(false);
  const [revoked, setRevoked] = useState(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const { user } = useAuth();

  // Re-checks the current password, then sets the new one.
  const savePwd = async () => {
    setPwdError("");
    if (!pwd.current || !pwd.next) return setPwdError("Fill in all fields.");
    if (pwd.next.length < 6) return setPwdError("The new password must be at least 6 characters.");
    if (pwd.next !== pwd.confirm) return setPwdError("Passwords do not match.");
    setPwdBusy(true);
    try {
      await signInWithPassword(user?.email || "", pwd.current);
      await updatePassword(pwd.next);
      setPwdSaved(true);
      setPwd({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwdSaved(false), 2500);
    } catch (e) {
      setPwdError(e.message === "Invalid login credentials" ? "Current password is incorrect." : e.message || "Update failed.");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <PortalLayout title="Security Settings" theme="light">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Account security</h1>
        <p className="text-sm text-slate-500">Manage privacy, two-factor authentication and active sessions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Eye className="h-5 w-5 text-emerald-600" /> Privacy</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                {profileVisible ? <Eye className="h-4 w-4 text-slate-400" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                <div>
                  <p className="text-sm font-medium text-slate-900">Public profile</p>
                  <p className="text-xs text-slate-500">Let other members see your name and badges</p>
                </div>
              </div>
              <button onClick={() => setProfileVisible(!profileVisible)} className={`relative h-6 w-11 rounded-full transition ${profileVisible ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${profileVisible ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-900">Data & activity</p>
              <p className="text-xs text-slate-500">Download or delete your account data.</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Download</button>
                <button className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /> Delete account</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2FA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Shield className="h-5 w-5 text-emerald-600" /> Two-factor authentication</h3>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-900">Authenticator app</p>
                <p className="text-xs text-slate-500">{twoFA ? "Enabled" : "Disabled"} · OTP on login</p>
              </div>
            </div>
            <button onClick={() => setTwoFA(!twoFA)} className={`relative h-6 w-11 rounded-full transition ${twoFA ? "bg-emerald-500" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${twoFA ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          {twoFA && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">Backup codes</p>
                <button onClick={() => setShowCodes(!showCodes)} className="text-xs font-medium text-emerald-600 hover:underline">{showCodes ? "Hide" : "Reveal"}</button>
              </div>
              {showCodes ? (
                <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-slate-700">
                  {["NEL-7K2P9", "NEL-Q3M8T1", "NEL-B9R4W2", "NEL-X7K2P9"].map((c) => <span key={c} className="rounded bg-white px-2 py-1 ring-1 ring-slate-200">{c}</span>)}
                </div>
              ) : <p className="mt-1 text-xs text-slate-400">8 codes available · use one if you lose your device.</p>}
            </div>
          )}
        </motion.div>

        {/* Change password */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Lock className="h-5 w-5 text-emerald-600" /> Change password</h3>
          <div className="mt-4 space-y-3">
            <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="Current password" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="New password" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="Confirm new password" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500" />
            <button onClick={savePwd} disabled={pwdBusy} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">{pwdBusy ? "Updating…" : "Update password"}</button>
            {pwdError && <p className="text-sm text-rose-600">{pwdError}</p>}
            {pwdSaved && <p className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Password updated.</p>}
          </div>
        </motion.div>

        {/* Active sessions */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Monitor className="h-5 w-5 text-emerald-600" /> Active sessions</h3>
          <div className="mt-4 space-y-3">
            {sessions.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200"><Icon className="h-5 w-5" /></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{s.device} {s.current && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">This device</span>}</p>
                    <p className="text-xs text-slate-500">{s.location} · {s.ip} · {s.last}</p>
                  </div>
                  {!s.current && (
                    <button onClick={() => setRevoked(s.id)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"><LogOut className="h-3.5 w-3.5" /> Revoke</button>
                  )}
                </div>
              );
            })}
            {revoked && <p className="text-xs text-emerald-600">Session revoked.</p>}
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
}