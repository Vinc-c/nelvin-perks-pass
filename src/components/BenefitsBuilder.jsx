import React, { useEffect, useMemo, useState } from "react";
import { entities } from "@/api/entities";
import { callRpc } from "@/api/rpc";
import { useAuth } from "@/lib/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDisplayCurrency } from "@/hooks/useDisplayCurrency";
import { OFFER_CATEGORIES, categoryMeta } from "@/data/offerCategories";
import CheckoutModal from "@/components/CheckoutModal";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { SlidersHorizontal, Save, Plus, Trash2, Wallet, Send, Loader2, Gift } from "lucide-react";

/**
 * Company benefits policy: a monthly allowance per category for every active
 * employee, funded by the company wallet and distributed once per month.
 */
export default function BenefitsBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const money = useCurrencies();
  const [currency] = useDisplayCurrency();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [bonus, setBonus] = useState({ user_id: "", amount: "", label: "" });
  const companyId = user?.company_id;

  const { data, reload } = useAsync(async () => {
    if (!companyId) return null;
    const [company, policies, runs, people] = await Promise.all([
      entities.Company.get(companyId),
      entities.BenefitPolicy.filter({ company_id: companyId }, "label"),
      entities.AllowanceRun.filter({ company_id: companyId }, "-created_date", 12),
      callRpc("company_directory"),
    ]);
    return { company, policies, runs, people: people || [] };
  }, [companyId]);

  useEffect(() => {
    if (data?.policies) {
      setRows(data.policies.map((p) => ({ ...p, amount: String(Math.round(money.fromUsd(p.monthly_amount_usd, currency) * 100) / 100) })));
    }
  }, [data?.policies, currency]);

  const employees = (data?.people || []).filter((p) => p.role === "EMPLOYEE");
  const perEmployeeUsd = rows.filter((r) => r.active !== false).reduce((s, r) => s + money.toUsd(Number(r.amount) || 0, currency), 0);
  const totalUsd = perEmployeeUsd * employees.length;
  const period = new Date().toISOString().slice(0, 7);
  const alreadyRun = (data?.runs || []).some((r) => r.period === period);
  const balance = Number(data?.company?.wallet_balance || 0);
  const unused = useMemo(() => OFFER_CATEGORIES.filter((c) => !rows.some((r) => r.category === c.value)), [rows]);

  const addRow = () => {
    const c = unused[0];
    if (c) setRows((r) => [...r, { category: c.value, label: c.label, amount: "0", active: true, _new: true }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const keep = new Set(rows.map((r) => r.category));
      for (const p of data.policies) if (!keep.has(p.category)) await entities.BenefitPolicy.delete(p.id);
      for (const r of rows) {
        const values = {
          category: r.category,
          label: (r.label || categoryMeta(r.category).label).slice(0, 60),
          monthly_amount_usd: Math.round(money.toUsd(Number(r.amount) || 0, currency) * 100) / 100,
          active: r.active !== false,
        };
        if (r.id) await entities.BenefitPolicy.update(r.id, values);
        else await entities.BenefitPolicy.create({ ...values, company_id: companyId });
      }
      toast({ title: t("hr.b.saved") });
      reload();
    } catch (e) {
      toast({ title: t("hr.b.error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const distribute = async () => {
    if (!window.confirm(t("hr.b.confirmDist", { amount: money.format(totalUsd, currency), n: employees.length, period }))) return;
    setDistributing(true);
    try {
      const res = await callRpc("hr_distribute_allowances");
      toast({ title: t("hr.b.distributed"), description: t("hr.b.distDesc", { n: res.employees, amount: money.format(res.total_usd, currency) }) });
      reload();
    } catch (e) {
      toast({ title: t("hr.b.distFail"), description: e.message, variant: "destructive" });
    } finally {
      setDistributing(false);
    }
  };

  const sendBonus = async (e) => {
    e.preventDefault();
    try {
      await callRpc("hr_allocate", {
        p_user_id: bonus.user_id,
        p_amount_usd: Math.round(money.toUsd(Number(bonus.amount), currency) * 100) / 100,
        p_label: bonus.label || t("hr.b.bonusLabel"),
      });
      toast({ title: t("hr.b.bonusSent") });
      setBonus({ user_id: "", amount: "", label: "" });
      reload();
    } catch (err) {
      toast({ title: t("hr.b.bonusFail"), description: err.message, variant: "destructive" });
    }
  };

  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-2 text-sm text-slate-500"><Wallet className="h-4 w-4" /> {t("hr.b.budget")}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{money.format(balance, currency)}</p>
          <button onClick={() => setTopupOpen(true)} className="mt-2 flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline"><Plus className="h-4 w-4" /> {t("hr.b.topup")}</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{t("hr.b.perEmp")}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{money.format(perEmployeeUsd, currency)}</p>
          <p className="text-xs text-slate-500">{t("hr.b.activeEmp", { n: employees.length })}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${totalUsd > balance ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
          <p className="text-sm text-slate-500">{t("hr.b.total", { period })}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{money.format(totalUsd, currency)}</p>
          <button onClick={distribute} disabled={distributing || alreadyRun || totalUsd <= 0 || totalUsd > balance} className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {distributing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {alreadyRun ? t("hr.b.already") : t("hr.b.pay")}
          </button>
          {totalUsd > balance && !alreadyRun && <p className="mt-1 text-xs text-rose-600">{t("hr.b.noFunds")}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><SlidersHorizontal className="h-5 w-5 text-emerald-600" /> {t("hr.b.policy")}</h3>
          <button onClick={addRow} disabled={!unused.length} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Plus className="h-4 w-4" /> {t("hr.b.category")}</button>
        </div>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t("hr.b.policyEmpty")}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {rows.map((r, i) => (
              <div key={r.id || r.category} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <select value={r.category} onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, category: e.target.value, label: categoryMeta(e.target.value).label } : x)))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm" aria-label="Catégorie">
                  {[categoryMeta(r.category), ...unused].filter((c, k, arr) => arr.findIndex((y) => y.value === c.value) === k).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input value={r.label} onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm" aria-label={t("hr.b.labelAria")} />
                <div className="flex items-center gap-1">
                  <input type="number" min="0" value={r.amount} onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm" aria-label="Montant mensuel" />
                  <span className="text-xs text-slate-500">{t("hr.b.perMonth", { currency })}</span>
                </div>
                <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={r.active !== false} onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} className="accent-emerald-500" /> Active</label>
                <button onClick={() => setRows((list) => list.filter((_, j) => j !== i))} aria-label={t("hr.b.delete")} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("hr.b.savePolicy")}
          </button>
        </div>
      </div>

      <form onSubmit={sendBonus} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Gift className="h-5 w-5 text-amber-500" /> {t("hr.b.oneOff")}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <select required value={bonus.user_id} onChange={(e) => setBonus({ ...bonus, user_id: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label={t("hr.b.employee")}>
            <option value="">{t("hr.b.employeePh")}</option>
            {(data?.people || []).filter((p) => p.id !== user.id).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <input required type="number" min="1" value={bonus.amount} onChange={(e) => setBonus({ ...bonus, amount: e.target.value })} placeholder={t("hr.b.amountPh", { currency })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" aria-label={t("hr.b.amount")} />
          <input value={bonus.label} onChange={(e) => setBonus({ ...bonus, label: e.target.value })} maxLength={120} placeholder={t("hr.b.reasonPh")} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" aria-label={t("hr.b.reason")} />
          <button type="submit" disabled={!bonus.user_id || !(Number(bonus.amount) > 0)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">{t("hr.b.send")}</button>
        </div>
        <p className="mt-2 text-xs text-slate-400">{t("hr.b.bonusNote")}</p>
      </form>

      {(data?.runs || []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">{t("hr.b.history")}</h3>
          <div className="mt-3 space-y-1 text-sm">
            {data.runs.map((r) => (
              <div key={r.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"><span>{t("hr.b.runLine", { period: r.period, n: r.employees })}</span><span className="font-medium">{money.format(r.total_usd, currency)}</span></div>
            ))}
          </div>
        </div>
      )}

      <CheckoutModal open={topupOpen} purpose="COMPANY_TOPUP" onClose={() => { setTopupOpen(false); reload(); }} />
    </div>
  );
}
