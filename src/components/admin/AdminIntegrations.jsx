import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { invokeFunction } from "@/api/functions";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, Lock, PlugZap, Plus, Save, ShieldCheck, Trash2, XCircle } from "lucide-react";

// What each service is for, where to get the key, and which secret / setting fields it takes.
// Mirrors public.integration_secret_ok() / integration_config_ok(): the database is the real gate.
const CATALOG = {
  resend: {
    purpose: "Sends every platform email: welcome, reminders, legal-page notices, notifications.",
    link: "https://resend.com/api-keys", linkLabel: "Get a key (Resend)",
    secrets: [{ key: "RESEND_API_KEY", label: "API key", placeholder: "re_…" }],
    config: [{ key: "EMAIL_FROM", label: "Sender", placeholder: "Nelvin <no-reply@nelvinbenefits.com>", help: "The domain must be verified in Resend." }],
    test: true,
  },
  gemini: {
    purpose: "Powers the in-app Nelvin Support assistant.",
    link: "https://aistudio.google.com/apikey", linkLabel: "Get a key (Google AI Studio)",
    secrets: [{ key: "GEMINI_API_KEY", label: "API key", placeholder: "AIza…" }],
    config: [{ key: "GEMINI_MODEL", label: "Model", placeholder: "gemini-3.8-flash", help: "Default: gemini-3.8-flash. Others: gemini-3.6-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview. Older 2.5 models are closed to new keys." }],
    test: true,
  },
  anthropic: {
    purpose: "Alternative engine for the Nelvin Support assistant (used as fallback if both are connected).",
    link: "https://console.anthropic.com/settings/keys", linkLabel: "Get a key (Anthropic)",
    secrets: [{ key: "ANTHROPIC_API_KEY", label: "API key", placeholder: "sk-ant-…" }],
    config: [{ key: "ANTHROPIC_MODEL", label: "Model", placeholder: "claude-haiku-4-5-20251001", help: "Leave empty for the default." }],
    test: true,
  },
  twilio: {
    purpose: "Stores SMS / WhatsApp credentials. Nothing sends through Twilio yet: the keys are ready for when a feature needs them.",
    link: "https://console.twilio.com", linkLabel: "Open Twilio console",
    secrets: [{ key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "AC…" }, { key: "TWILIO_AUTH_TOKEN", label: "Auth token", placeholder: "" }],
    config: [{ key: "TWILIO_FROM", label: "SMS sender number", placeholder: "+1…" }, { key: "TWILIO_WHATSAPP_FROM", label: "WhatsApp sender", placeholder: "whatsapp:+1…" }],
    test: true,
  },
  custom: {
    purpose: "Any other service. Keys are stored encrypted under the name you choose, ready for a server function to read. Nothing uses them automatically.",
    secrets: [], config: [], test: false,
  },
};

const input = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-nv-emerald";

function SecretField({ id, field, meta, onSaved }) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async (clear = false) => {
    if (!clear && !value.trim()) return;
    if (clear && !window.confirm(`Delete ${field.label}? Features using it will stop working until a new key is saved.`)) return;
    setBusy(true);
    try {
      await callRpc("admin_set_integration_secret", { p_id: id, p_field: field.key, p_value: clear ? "" : value.trim() });
      setValue(""); toast({ title: clear ? "Key deleted" : "Key saved", description: "Stored encrypted in the Vault." }); onSaved();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{field.label}</span>
        {meta ? <span className="flex items-center gap-1 font-mono text-emerald-700"><Lock className="h-3 w-3" /> {meta.hint}{meta.at ? <span className="font-sans text-slate-400"> · set {new Date(meta.at).toLocaleDateString()}</span> : null}</span> : <span className="text-slate-400">not set</span>}
      </div>
      <div className="mt-1 flex gap-1.5">
        <div className="relative flex-1">
          <input type={show ? "text" : "password"} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" spellCheck={false}
            placeholder={meta ? "Replace key…" : field.placeholder || "Paste the key"} aria-label={`${id} ${field.label}`} className={`${input} pr-8 font-mono`} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1.5 text-slate-400" aria-label={show ? "Hide" : "Show"}>{show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
        </div>
        <button type="button" onClick={() => save(false)} disabled={busy || !value.trim()} className="rounded-lg bg-slate-900 px-2.5 text-white disabled:opacity-40" aria-label="Save key">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}</button>
        {meta && <button type="button" onClick={() => save(true)} disabled={busy} className="rounded-lg border border-rose-200 px-2 text-rose-500 hover:bg-rose-50" aria-label="Delete key"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
}

function Card({ row, onChange, aiPref, setAiPref }) {
  const { toast } = useToast();
  const cat = CATALOG[row.id] || CATALOG.custom;
  const [cfg, setCfg] = useState(row.config || {});
  const [testing, setTesting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVal, setNewVal] = useState("");
  const hints = row.secret_hints || {};
  const connected = Object.keys(hints).length > 0;
  const secrets = row.id === "custom" ? Object.keys(hints).map((k) => ({ key: k, label: k })) : cat.secrets;

  const update = async (enabled, config) => {
    try { await callRpc("admin_update_integration", { p_id: row.id, p_enabled: enabled, p_config: config ?? null }); onChange(); }
    catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const test = async () => {
    setTesting(true);
    try {
      const { data } = await invokeFunction("integration-test", { id: row.id });
      toast({ title: data?.ok ? `${row.display_name}: OK` : `${row.display_name}: problem`, description: String(data?.message || ""), variant: data?.ok ? undefined : "destructive" });
    } catch (e) { toast({ title: "Test failed", description: e.message, variant: "destructive" }); } finally { setTesting(false); onChange(); }
  };
  const addCustom = async () => {
    try {
      await callRpc("admin_set_integration_secret", { p_id: "custom", p_field: newName.trim().toUpperCase(), p_value: newVal.trim() });
      setNewName(""); setNewVal(""); toast({ title: "Key saved", description: "Stored encrypted in the Vault." }); onChange();
    } catch (e) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border bg-white p-5 shadow-sm ${row.enabled && connected ? "border-nv-emerald" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{row.display_name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{cat.purpose}</p>
          {cat.link && <a href={cat.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-nv-emerald hover:underline">{cat.linkLabel} <ExternalLink className="h-3 w-3" /></a>}
        </div>
        {row.id !== "custom" && (
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <span>{!connected ? "No key" : row.enabled ? "Active" : "Paused"}</span>
            <button type="button" role="switch" aria-checked={row.enabled} disabled={!connected} onClick={() => update(!row.enabled)}
              className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${row.enabled ? "bg-nv-emerald" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${row.enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {secrets.map((f) => <SecretField key={f.key} id={row.id} field={f} meta={hints[f.key]} onSaved={onChange} />)}
        {row.id === "custom" && (
          <div className="rounded-xl border border-dashed border-slate-300 p-3">
            <p className="text-xs font-medium text-slate-600">Add a key</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
              <input value={newName} onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} placeholder="NAME_OF_KEY" aria-label="Key name" className={`${input} font-mono`} />
              <input type="password" value={newVal} onChange={(e) => setNewVal(e.target.value)} placeholder="Secret value" autoComplete="off" aria-label="Key value" className={`${input} font-mono`} />
              <button type="button" onClick={addCustom} disabled={newName.length < 3 || !newVal.trim()} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Capital letters, digits and underscores, 3 to 60 characters. 25 keys maximum.</p>
          </div>
        )}
        {cat.config.length > 0 && (
          <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
            {cat.config.map((f) => (
              <label key={f.key} className="text-xs font-medium text-slate-600">{f.label}
                <input value={cfg[f.key] || ""} onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })} placeholder={f.placeholder} maxLength={200} className={`${input} mt-1`} />
                {f.help && <span className="mt-0.5 block font-normal text-slate-400">{f.help}</span>}
              </label>
            ))}
            <div className="sm:col-span-2"><button type="button" onClick={() => update(undefined, cfg)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Save settings</button></div>
          </div>
        )}
        {row.category === "ai" && connected && (
          <label className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
            <input type="radio" name="ai-primary" checked={aiPref === row.id} onChange={() => setAiPref(row.id)} /> Use {row.id === "gemini" ? "Gemini" : "Claude"} first for the support assistant
          </label>
        )}
      </div>

      {cat.test && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <button type="button" onClick={test} disabled={testing || !connected} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />} Test connection
          </button>
          {row.last_test_at && (
            <span className={`flex min-w-0 items-start gap-1 text-xs ${row.last_test_ok ? "text-emerald-700" : "text-rose-600"}`}>
              {row.last_test_ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{row.last_test_message} <span className="text-slate-400">· {new Date(row.last_test_at).toLocaleString()}</span></span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** Super admin: third-party keys (Resend, Gemini, Anthropic, Twilio, custom). Write-only, encrypted in Supabase Vault. */
export default function AdminIntegrations() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [aiPref, setAiPrefState] = useState("gemini");

  const load = useCallback(async () => {
    const [{ data, error }, { data: pref }] = await Promise.all([
      supabase.from("integrations").select("*").order("category").order("display_name"),
      supabase.from("platform_settings").select("value").eq("key", "support_ai_provider").maybeSingle(),
    ]);
    if (error) { toast({ title: error.message, variant: "destructive" }); setRows([]); return; }
    setRows(data || []);
    if (pref?.value === "anthropic" || pref?.value === "gemini") setAiPrefState(pref.value);
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const setAiPref = async (v) => {
    setAiPrefState(v);
    const { error } = await supabase.from("platform_settings").upsert({ key: "support_ai_provider", value: v }, { onConflict: "key" });
    if (error) toast({ title: "Could not save", description: "Sign in again with 2FA and retry.", variant: "destructive" });
    else toast({ title: "Saved" });
  };

  const order = ["resend", "gemini", "anthropic", "twilio", "custom"];
  const sorted = rows ? [...rows].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Integrations & keys</h2>
        <p className="text-sm text-slate-500">Connect the services Nelvin relies on. Payment providers have their own section (PSP keys & routing).</p>
      </div>
      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <ul className="space-y-1">
          <li>Keys are encrypted in Supabase Vault. This screen can set or replace them but <b>never shows them again</b>: only the last 4 characters.</li>
          <li>Only a Super admin signed in with two-step verification can change them. Every change is recorded in the audit log (never the key itself).</li>
          <li>Rotate a key from here at any time: the old one is overwritten at once. If a key may have leaked, revoke it at the provider first.</li>
        </ul>
      </div>
      {sorted === null ? <Spinner /> : <div className="grid gap-4 lg:grid-cols-2">{sorted.map((r) => <Card key={r.id} row={r} onChange={load} aiPref={aiPref} setAiPref={setAiPref} />)}</div>}
    </div>
  );
}
