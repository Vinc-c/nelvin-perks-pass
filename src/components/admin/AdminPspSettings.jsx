import React, { useState } from "react";
import { motion } from "framer-motion";
import { entities } from "@/api/entities";
import { supabaseUrl } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { invokeFunction } from "@/api/functions";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { routePayment } from "@/lib/paymentRouter";
import { AFRICAN_COUNTRIES } from "@/data/africanCountries";
import { Spinner } from "@/components/UiFeedback";
import { KeyRound, Eye, EyeOff, Save, Trash2, PlugZap, CheckCircle2, XCircle, Loader2, ShieldCheck, Route, Zap, Lock, Copy } from "lucide-react";

// Secret fields accepted per PSP (mirrors public.psp_secret_fields()).
export const PSP_FIELDS = {
  stripe: [
    { key: "STRIPE_SECRET_KEY", label: "Secret key", placeholder: "sk_live_… or sk_test_…" },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Webhook secret (optional)", placeholder: "whsec_…" },
  ],
  paystack: [{ key: "PAYSTACK_SECRET_KEY", label: "Secret key", placeholder: "sk_live_…" }],
  flutterwave: [
    { key: "FLUTTERWAVE_SECRET_KEY", label: "Secret key", placeholder: "FLWSECK-…" },
    { key: "FLUTTERWAVE_WEBHOOK_HASH", label: "Webhook hash (optional)", placeholder: "" },
  ],
  paddle: [
    { key: "PADDLE_API_KEY", label: "API key", placeholder: "pdl_live_apikey_…" },
    { key: "PADDLE_WEBHOOK_SECRET", label: "Webhook secret (optional)", placeholder: "pdl_ntfset_…" },
  ],
  payunit: [
    { key: "PAYUNIT_API_KEY", label: "API key", placeholder: "" },
    { key: "PAYUNIT_API_USERNAME", label: "API user", placeholder: "" },
    { key: "PAYUNIT_API_PASSWORD", label: "API password", placeholder: "" },
  ],
  korapay: [{ key: "KORAPAY_SECRET_KEY", label: "Secret key", placeholder: "sk_live_…" }],
};

const PUBLIC_KEY_HINT = {
  stripe: "pk_live_…", paystack: "pk_live_…", flutterwave: "FLWPUBK-…", paddle: "live_… (client-side token)", payunit: "", korapay: "pk_live_…",
};

function SecretField({ provider, field, hint, onSaved }) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (clear = false) => {
    if (!clear && !value.trim()) return;
    if (clear && !window.confirm(`Delete ${field.label} for ${provider}?`)) return;
    setBusy(true);
    try {
      await callRpc("admin_set_psp_secret", { p_provider: provider, p_field: field.key, p_value: clear ? "" : value.trim() });
      setValue("");
      toast({ title: clear ? "Key deleted" : "Key saved", description: "Stored encrypted in the Vault." });
      onSaved();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{field.label}</span>
        {hint ? <span className="flex items-center gap-1 font-mono text-emerald-700"><Lock className="h-3 w-3" /> {hint}</span> : <span className="text-slate-400">not set</span>}
      </div>
      <div className="mt-1 flex gap-1.5">
        <div className="relative flex-1">
          <input type={show ? "text" : "password"} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" spellCheck={false}
            placeholder={hint ? "Replace key…" : field.placeholder || "Paste the key"} aria-label={`${provider} ${field.label}`}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1.5 text-slate-400" aria-label={show ? "Hide" : "Show"}>
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <button type="button" onClick={() => save(false)} disabled={busy || !value.trim()} className="rounded-lg bg-slate-900 px-2.5 text-white hover:bg-slate-800 disabled:opacity-40" aria-label="Save">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </button>
        {hint && (
          <button type="button" onClick={() => save(true)} disabled={busy} className="rounded-lg border border-rose-200 px-2 text-rose-500 hover:bg-rose-50" aria-label="Delete key">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ p, onChange }) {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [publicKey, setPublicKey] = useState(p.public_key || "");
  const hasSecret = Object.keys(p.secret_hints || {}).length > 0;
  const webhook = `${supabaseUrl}/functions/v1/payment-webhook?psp=${p.id}`;

  const patch = async (values) => {
    try {
      const row = await entities.PspProvider.update(p.id, values);
      if (!row) throw new Error("Change refused: sign in again (2FA verification required) and retry.");
      onChange();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await invokeFunction("psp-test", { provider: p.id });
      const ok = !!res?.data?.ok;
      toast({ title: ok ? `${p.display_name}: connection OK` : `${p.display_name}: failed`, description: String(res?.data?.message ?? ""), variant: ok ? undefined : "destructive" });
    } catch (e) {
      toast({ title: "Test failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setTesting(false);
      onChange();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border bg-white p-5 shadow-sm ${p.enabled ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{p.display_name}</p>
          <p className="text-xs text-slate-500">{p.region}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(p.methods || []).map((m) => <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{m}</span>)}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
          <span>{p.enabled ? "Active" : "Inactive"}</span>
          <button type="button" role="switch" aria-checked={p.enabled} onClick={() => patch({ enabled: !p.enabled })}
            className={`relative h-6 w-11 rounded-full transition ${p.enabled ? "bg-emerald-500" : "bg-slate-300"}`} title={!hasSecret ? "No key in the Vault: the server's environment secrets will be used" : ""}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${p.enabled ? "left-5" : "left-0.5"}`} />
          </button>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 text-slate-600">
          <input type="checkbox" checked={p.live_mode} onChange={(e) => patch({ live_mode: e.target.checked })} className="accent-rose-500" />
          Production mode (live)
        </label>
        <label className="flex items-center gap-1.5 text-slate-600">
          Priority
          <input type="number" min={1} max={999} defaultValue={p.priority} onBlur={(e) => Number(e.target.value) !== p.priority && patch({ priority: Number(e.target.value) || 100 })} className="w-16 rounded-md border border-slate-200 px-2 py-1" aria-label="Priority" />
        </label>
        {!p.live_mode && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">Test / sandbox</span>}
      </div>

      {!hasSecret && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">No key in the Vault: the server will use environment secrets (e.g. {(PSP_FIELDS[p.id] || [])[0]?.key}) if they exist. Use “Test” to check.</p>
      )}
      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        {(PSP_FIELDS[p.id] || []).map((f) => <SecretField key={f.key} provider={p.id} field={f} hint={p.secret_hints?.[f.key]} onSaved={onChange} />)}
        <div>
          <span className="text-xs font-medium text-slate-600">Webhook URL {p.id === "payunit" || p.id === "korapay" ? "(sent automatically)" : "(paste into the PSP dashboard)"}</span>
          <div className="mt-1 flex gap-1">
            <input readOnly value={webhook} onFocus={(e) => e.target.select()} aria-label={`${p.display_name} webhook URL`} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600" />
            <button type="button" onClick={() => navigator.clipboard?.writeText(webhook).then(() => toast({ title: "URL copied" }), () => {})} className="rounded-lg border border-slate-200 px-2 text-slate-500 hover:bg-slate-50" aria-label="Copy webhook URL"><Copy className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {PUBLIC_KEY_HINT[p.id] !== "" && (
          <div>
            <span className="text-xs font-medium text-slate-600">Public key (not secret)</span>
            <input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} onBlur={() => publicKey !== (p.public_key || "") && patch({ public_key: publicKey.trim() || null })} placeholder={PUBLIC_KEY_HINT[p.id]} aria-label={`${p.display_name} public key`} className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs outline-none focus:border-emerald-500" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="flex min-w-0 items-center gap-1.5 text-xs">
          {p.last_test_at ? (
            p.last_test_ok
              ? <><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /><span className="truncate text-emerald-700">{p.last_test_message}</span></>
              : <><XCircle className="h-4 w-4 shrink-0 text-rose-500" /><span className="truncate text-rose-600">{p.last_test_message}</span></>
          ) : <span className="text-slate-400">Never tested</span>}
        </span>
        <button onClick={test} disabled={testing} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />} Test
        </button>
      </div>
    </motion.div>
  );
}

/** Super admin: PSP credentials (Vault), activation, live mode, routing preview. */
export default function AdminPspSettings() {
  const { data, loading, reload } = useAsync(() => entities.PspProvider.list("priority"), [], { initial: [] });
  const providers = Array.isArray(data) ? data : [];
  const [audience, setAudience] = useState("B2C");
  const [method, setMethod] = useState("MOBILE_MONEY");
  const [country, setCountry] = useState("Cameroun");

  if (loading && !providers.length) return <Spinner />;

  const enabled = providers.filter((p) => p.enabled).map((p) => ({ id: p.id, methods: p.methods, has_secret: Object.keys(p.secret_hints || {}).length > 0 }));
  let route = null;
  let routeError = "";
  try {
    route = routePayment({ audience, method, country }, enabled);
  } catch (e) {
    routeError = e.message;
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Secret keys are encrypted in Supabase Vault and are never sent back to the browser: only the last 4 characters are shown. Only the payment Edge Functions can read them. Every change is recorded in the audit log.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => <ProviderCard key={p.id} p={p} onChange={reload} />)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Route className="h-5 w-5 text-emerald-600" /> Routing simulator</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Audience" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="B2C">B2C (individual, employee)</option>
            <option value="B2B">B2B (company, merchant)</option>
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {["CARD", "MOBILE_MONEY", "BANK_TRANSFER", "APPLE_PAY", "GOOGLE_PAY"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {AFRICAN_COUNTRIES.map((c) => <option key={c.iso} value={c.name}>{c.flag} {c.name}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <Zap className="mt-0.5 h-5 w-5 text-amber-500" />
          {route ? (
            <div>
              <p className="text-lg font-bold text-emerald-600">{route.primary.name}</p>
              <p className="text-xs text-slate-500">{route.reason}</p>
              {enabled.length === 0 && <p className="mt-1 text-xs text-amber-600">No PSP enabled: the theoretical routing is shown (keys read from server secrets).</p>}
            </div>
          ) : (
            <p className="text-sm text-rose-600">{routeError}</p>
          )}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><KeyRound className="h-3.5 w-3.5" /> Keys come from the Vault, or otherwise from the Edge Functions' environment secrets.</p>
      </div>
    </div>
  );
}
