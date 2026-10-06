import React, { useState } from "react";
import { entities } from "@/api/entities";
import { loadCurrencies } from "@/hooks/useCurrencies";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Globe, Plus, Save } from "lucide-react";

/** Super admin: exchange rates (units per 1 USD) used for every conversion. */
export default function AdminCurrencies() {
  const { toast } = useToast();
  const { data: rows, loading, reload } = useAsync(() => entities.Currency.list("sort_order"), [], { initial: [] });
  const [edits, setEdits] = useState({});
  const [draft, setDraft] = useState({ code: "", name: "", symbol: "", rate_per_usd: "", region: "" });

  const set = (code, k, v) => setEdits((e) => ({ ...e, [code]: { ...e[code], [k]: v } }));

  const save = async (c) => {
    const patch = edits[c.code];
    if (!patch) return;
    try {
      const values = { ...patch };
      if ("rate_per_usd" in values) values.rate_per_usd = Number(values.rate_per_usd);
      await entities.Currency.update(c.code, values);
      setEdits((e) => ({ ...e, [c.code]: undefined }));
      await loadCurrencies(true);
      toast({ title: `${c.code} mis à jour` });
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const add = async (e) => {
    e.preventDefault();
    try {
      await entities.Currency.create({ ...draft, code: draft.code.toUpperCase(), rate_per_usd: Number(draft.rate_per_usd), sort_order: rows.length });
      setDraft({ code: "", name: "", symbol: "", rate_per_usd: "", region: "" });
      await loadCurrencies(true);
      reload();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  if (loading && !rows.length) return <Spinner />;

  return (
    <div className="mt-6 space-y-4">
      <p className="flex items-center gap-2 text-sm text-slate-500"><Globe className="h-4 w-4" /> Tous les soldes sont conservés en USD. Ces taux servent aux recharges, retraits, validations en caisse et à l'affichage. Le USD reste la base (taux 1).</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Nom</th>
              <th className="p-3 font-medium">Symbole</th>
              <th className="p-3 font-medium">Pour 1 USD</th>
              <th className="p-3 font-medium">Région</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium">Mise à jour</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const e = edits[c.code] || {};
              const v = (k) => (k in e ? e[k] : c[k] ?? "");
              const base = c.code === "USD";
              return (
                <tr key={c.code} className="border-b border-slate-50">
                  <td className="p-3 font-mono font-semibold text-slate-900">{c.code}</td>
                  <td className="p-3"><input value={v("name")} onChange={(ev) => set(c.code, "name", ev.target.value)} className="w-40 rounded-md border border-slate-200 px-2 py-1" /></td>
                  <td className="p-3"><input value={v("symbol")} onChange={(ev) => set(c.code, "symbol", ev.target.value)} className="w-16 rounded-md border border-slate-200 px-2 py-1" /></td>
                  <td className="p-3"><input type="number" step="any" min="0" disabled={base} value={v("rate_per_usd")} onChange={(ev) => set(c.code, "rate_per_usd", ev.target.value)} className="w-28 rounded-md border border-slate-200 px-2 py-1 font-mono disabled:bg-slate-50" /></td>
                  <td className="p-3"><input value={v("region")} onChange={(ev) => set(c.code, "region", ev.target.value)} className="w-40 rounded-md border border-slate-200 px-2 py-1" /></td>
                  <td className="p-3"><input type="checkbox" disabled={base} checked={!!v("active")} onChange={(ev) => set(c.code, "active", ev.target.checked)} className="accent-emerald-500" /></td>
                  <td className="p-3 text-xs text-slate-400">{c.updated_date ? new Date(c.updated_date).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => save(c)} disabled={!edits[c.code]} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-30"><Save className="h-3.5 w-3.5" /> Enregistrer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input required maxLength={3} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="Code (ex. GHS)" className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nom" className="w-44 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <input required value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} placeholder="Symbole" className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <input required type="number" step="any" min="0" value={draft.rate_per_usd} onChange={(e) => setDraft({ ...draft, rate_per_usd: e.target.value })} placeholder="Pour 1 USD" className="w-32 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <input value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} placeholder="Région" className="w-40 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <button type="submit" className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"><Plus className="h-4 w-4" /> Ajouter</button>
      </form>
    </div>
  );
}
