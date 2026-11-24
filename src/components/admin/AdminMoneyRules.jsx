import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Trash2, Plus } from "lucide-react";

const GROUPS = [
  { title: "Top-up bonus", note: "Bonus tiers below are credited on top-ups. Bonus money can only be spent on purchases, never withdrawn.",
    fields: [["topup_bonus_enabled", "Bonus active (1 = on, 0 = off)"], ["promo_credits_spend_only", "Cashback, referral & HR credits are spend-only (1/0)"]] },
  { title: "Commission on purchases", note: "Taken from the merchant's receipt on every purchase paid with the Nelvin wallet.",
    fields: [["commission_pct", "Commission (%)"]] },
  { title: "Customer withdrawals", note: "Fees are deducted from the withdrawn amount. Only the cash balance (not bonus) can be withdrawn.",
    fields: [["withdrawal_fee_pct", "Platform fee (%)"], ["withdrawal_psp_fee_pct", "PSP fee (%)"], ["withdrawal_psp_fee_fixed_usd", "PSP fixed fee (USD)"], ["withdrawal_min_usd", "Minimum withdrawal (USD)"]] },
  { title: "Merchant payouts", note: "Merchants cash out the balance earned from wallet purchases (net of commission).",
    fields: [["payout_enabled", "Payout requests open (1/0)"], ["payout_min_usd", "Minimum payout (USD)"], ["payout_max_usd", "Maximum per request (USD)"],
      ["payout_basic_monthly_limit", "Requests / month, Merchant Basic (0 = unlimited)"], ["payout_pro_monthly_limit", "Requests / month, Merchant Pro (0 = unlimited)"],
      ["payout_fee_pct", "Payout fee (%)"], ["payout_sla_days", "Announced delay (days)"]] },
];
const KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f[0]));
const usd = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** Super admin: every rate and limit that moves money, in one place. */
export default function AdminMoneyRules() {
  const { toast } = useToast();
  const [vals, setVals] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [sum, setSum] = useState(null);
  const [draft, setDraft] = useState({ min_usd: "", type: "PERCENT", value: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, t, m] = await Promise.all([
      supabase.from("platform_settings").select("key,value").in("key", KEYS),
      supabase.from("topup_bonus_tiers").select("*").order("min_usd"),
      supabase.rpc("admin_money_summary"),
    ]);
    setVals(Object.fromEntries((s.data || []).map((r) => [r.key, String(r.value)])));
    setTiers(t.data || []);
    setSum(m.data || null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, ok) => {
    setBusy(true);
    try { await fn(); toast({ title: ok }); await load(); }
    catch (e) { toast({ title: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const saveRules = () => run(() => callRpc("admin_set_money_rules", { p_rules: Object.fromEntries(KEYS.map((k) => [k, Number(vals[k])])) }), "Rules saved");
  const saveTier = (t) => run(() => callRpc("admin_save_bonus_tier", { p_id: t.id ?? null, p_min_usd: Number(t.min_usd), p_type: t.bonus_type ?? t.type, p_value: Number(t.bonus_value ?? t.value), p_active: t.active ?? true }), "Tier saved");
  const addTier = async () => {
    await saveTier(draft);
    setDraft({ min_usd: "", type: "PERCENT", value: "" });
  };

  if (!vals) return <Spinner />;
  const inp = "nv-focus w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-right text-sm";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Money rules</h2>
        <p className="text-sm text-slate-500">Bonus, commission, withdrawal fees and merchant payouts. Changes apply immediately and are logged.</p>
      </div>
      {sum && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[["Commission earned (30 d)", sum.commission_30d], ["Bonus granted (30 d)", sum.bonus_granted_30d], ["Withdrawal fees (30 d)", sum.withdrawal_fees_30d],
            ["Customer wallets", sum.wallet_total], ["of which bonus (spend-only)", sum.bonus_outstanding], ["Owed to merchants", sum.merchant_payable]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{l}</p><p className="mt-1 text-lg font-bold text-slate-900">{usd(v)}</p></div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Top-up bonus tiers</h3>
        <p className="mb-3 text-sm text-slate-500">The highest tier reached by the top-up amount applies. Percent tiers are capped at 50%, fixed at $1,000.</p>
        <div className="space-y-2">
          {tiers.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span>From $</span>
              <input className={inp} type="number" min="1" defaultValue={t.min_usd} onBlur={(e) => Number(e.target.value) !== Number(t.min_usd) && saveTier({ ...t, min_usd: e.target.value })} aria-label="Minimum top-up in USD" />
              <select className="nv-focus rounded-lg border border-slate-300 px-2 py-1.5" defaultValue={t.bonus_type} onChange={(e) => saveTier({ ...t, bonus_type: e.target.value })} aria-label="Bonus type"><option value="PERCENT">% bonus</option><option value="FIXED">$ bonus</option></select>
              <input className={inp} type="number" min="0" defaultValue={t.bonus_value} onBlur={(e) => Number(e.target.value) !== Number(t.bonus_value) && saveTier({ ...t, bonus_value: e.target.value })} aria-label="Bonus value" />
              <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked={t.active} onChange={(e) => saveTier({ ...t, active: e.target.checked })} />Active</label>
              <button disabled={busy} onClick={() => window.confirm(`Delete the tier from $${t.min_usd}?`) && run(() => callRpc("admin_delete_bonus_tier", { p_id: t.id }), "Tier deleted")} className="nv-focus ml-auto rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Delete tier"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {tiers.length === 0 && <p className="text-sm text-slate-500">No tier yet: top-ups give no bonus.</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm">
          <span>New tier: from $</span>
          <input className={inp} type="number" min="1" value={draft.min_usd} onChange={(e) => setDraft({ ...draft, min_usd: e.target.value })} aria-label="New tier minimum" />
          <select className="nv-focus rounded-lg border border-slate-300 px-2 py-1.5" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} aria-label="New tier type"><option value="PERCENT">% bonus</option><option value="FIXED">$ bonus</option></select>
          <input className={inp} type="number" min="0" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} aria-label="New tier value" />
          <button disabled={busy || !draft.min_usd || draft.value === ""} onClick={addTier} className="nv-focus inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add tier</button>
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">{g.title}</h3>
          <p className="mb-3 text-sm text-slate-500">{g.note}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {g.fields.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <span>{label}</span>
                <input className={inp} type="number" step="any" min="0" value={vals[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button disabled={busy} onClick={saveRules} className="nv-focus rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white disabled:opacity-40">Save rules</button>
    </div>
  );
}
