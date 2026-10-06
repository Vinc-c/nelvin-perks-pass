import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { Settings2, Save } from "lucide-react";

const META = {
  referral_bonus_usd: { label: "Bonus de parrainage (USD)", type: "number" },
  trial_days: { label: "Essai gratuit entreprise (jours)", type: "number" },
  redemption_ttl_seconds: { label: "Validité d'un code de remise (secondes, 60–900)", type: "number" },
  recognition_points: { label: "Points par reconnaissance reçue", type: "number" },
  support_email: { label: "Email du support", type: "text" },
  mfa_required_roles: { label: "2FA obligatoire pour", type: "roles" },
};

const ROLES = [
  ["SUPER_ADMIN", "Super admins"], ["HR_ADMIN", "RH"], ["MERCHANT", "Partenaires"], ["EMPLOYEE", "Employés"], ["MEMBER", "Membres"],
];

/** Super admin: business parameters used by the database and functions. */
export default function AdminPlatformSettings() {
  const { toast } = useToast();
  const { data: rows, loading, reload } = useAsync(() => entities.PlatformSetting.list("key"), [], { initial: [] });
  const [edits, setEdits] = useState({});

  const save = async (row) => {
    const meta = META[row.key] || { type: "text" };
    const raw = edits[row.key];
    const value = meta.type === "number" ? Number(raw) : meta.type === "roles" ? raw : String(raw);
    if (meta.type === "roles" && !raw.includes("SUPER_ADMIN") && !window.confirm("Retirer la 2FA obligatoire pour les super admins affaiblit la sécurité. Continuer ?")) return;
    if (meta.type === "number" && !Number.isFinite(value)) return;
    try {
      await entities.PlatformSetting.update(row.key, { value });
      setEdits((e) => ({ ...e, [row.key]: undefined }));
      toast({ title: "Paramètre enregistré" });
      reload();
    } catch (e) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (loading && !rows.length) return <Spinner />;
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Settings2 className="h-5 w-5 text-slate-400" /> Paramètres de la plateforme</h3>
      <div className="mt-4 space-y-3">
        {rows.map((r) => {
          const meta = META[r.key] || { label: r.key, type: "text" };
          const current = r.value;
          const val = r.key in edits && edits[r.key] !== undefined ? edits[r.key] : current;
          return (
            <div key={r.key} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
              </div>
              <div className="flex gap-2">
                {meta.type === "roles" ? (
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(([code, label]) => {
                      const list = Array.isArray(val) ? val : [];
                      return (
                        <label key={code} className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={list.includes(code)} className="accent-emerald-500"
                            onChange={(e) => setEdits((x) => ({ ...x, [r.key]: e.target.checked ? [...list, code] : list.filter((c) => c !== code) }))} />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <input type={meta.type} value={val ?? ""} onChange={(e) => setEdits((x) => ({ ...x, [r.key]: e.target.value }))} className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm" aria-label={meta.label} />
                )}
                <button onClick={() => save(r)} disabled={edits[r.key] === undefined} className="rounded-lg bg-slate-900 px-3 text-white disabled:opacity-30" aria-label="Enregistrer"><Save className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
