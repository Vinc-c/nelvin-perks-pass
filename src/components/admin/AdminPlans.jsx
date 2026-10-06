import React, { useState } from "react";
import { entities } from "@/api/entities";
import { loadPlans } from "@/hooks/usePlans";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Save, Crown } from "lucide-react";

const AUDIENCE = { B2C: "Particuliers", B2B: "Entreprises", MERCHANT: "Partenaires" };

function PlanRow({ plan, onSaved }) {
  const { toast } = useToast();
  const [p, setP] = useState({ ...plan, featuresText: (plan.features || []).join("\n") });
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify({ ...plan, featuresText: (plan.features || []).join("\n") }) !== JSON.stringify(p);

  const save = async () => {
    setBusy(true);
    try {
      await entities.Plan.update(plan.code, {
        name: p.name, tagline: p.tagline || null,
        price_monthly: Number(p.price_monthly), price_annual: Number(p.price_annual),
        max_employees: p.audience === "B2B" && p.max_employees !== "" && p.max_employees != null ? Number(p.max_employees) : null,
        family_seats: p.audience === "B2C" ? Math.min(Math.max(Number(p.family_seats) || 0, 0), 10) : 0,
        features: p.featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
        popular: !!p.popular, active: !!p.active,
      });
      await loadPlans(true);
      toast({ title: `${p.name} mis à jour` });
      onSaved();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm";
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${p.active ? "border-slate-200" : "border-dashed border-slate-300 opacity-70"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-400">{plan.code}</span>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <label className="flex items-center gap-1"><input type="checkbox" checked={!!p.popular} onChange={(e) => setP({ ...p, popular: e.target.checked })} className="accent-amber-500" /> Mis en avant</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={!!p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} className="accent-emerald-500" /> Actif</label>
        </div>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} aria-label="Nom" className={input} />
        <input value={p.tagline || ""} onChange={(e) => setP({ ...p, tagline: e.target.value })} placeholder="Accroche" aria-label="Accroche" className={input} />
        <label className="text-xs text-slate-500">USD / mois<input type="number" min="0" step="0.01" value={p.price_monthly} onChange={(e) => setP({ ...p, price_monthly: e.target.value })} className={input} /></label>
        <label className="text-xs text-slate-500">USD / an<input type="number" min="0" step="0.01" value={p.price_annual} onChange={(e) => setP({ ...p, price_annual: e.target.value })} className={input} /></label>
        {p.audience === "B2C" && (
          <label className="text-xs text-slate-500">Proches inclus (abonnement famille, 0–10)<input type="number" min="0" max="10" value={p.family_seats ?? 0} onChange={(e) => setP({ ...p, family_seats: e.target.value })} className={input} /></label>
        )}
        {p.audience === "B2B" && (
          <label className="text-xs text-slate-500">Sièges max (vide = illimité)<input type="number" min="1" value={p.max_employees ?? ""} onChange={(e) => setP({ ...p, max_employees: e.target.value })} className={input} /></label>
        )}
      </div>
      <textarea value={p.featuresText} onChange={(e) => setP({ ...p, featuresText: e.target.value })} rows={4} aria-label="Avantages (un par ligne)" className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
      <div className="mt-2 flex justify-end">
        <button onClick={save} disabled={busy || !dirty} className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-30"><Save className="h-3.5 w-3.5" /> Enregistrer</button>
      </div>
    </div>
  );
}

/** Super admin: plan catalogue — the single source for every price shown or charged. */
export default function AdminPlans() {
  const { data: plans, loading, reload } = useAsync(() => entities.Plan.list("sort_order"), [], { initial: [] });
  if (loading && !plans.length) return <Spinner />;
  return (
    <div className="mt-6 space-y-6">
      <p className="flex items-center gap-2 text-sm text-slate-500"><Crown className="h-4 w-4" /> Ces prix alimentent la page Tarifs, les abonnements et les paiements. Un changement s'applique aux prochains paiements.</p>
      {Object.entries(AUDIENCE).map(([aud, label]) => (
        <div key={aud}>
          <h3 className="mb-3 font-semibold text-slate-900">{label}</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.filter((p) => p.audience === aud).map((p) => <PlanRow key={p.code + p.updated_date} plan={p} onSaved={reload} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
