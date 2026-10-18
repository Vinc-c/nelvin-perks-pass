import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Pencil, Save, Search, Star, Trash2, X } from "lucide-react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { DISCOUNT_TYPES } from "@/data/offerCategories";
import { offerBadge } from "@/hooks/useCatalog";
import { offerPath } from "@/lib/seo";
import SeoFields from "@/components/seo/SeoFields";
import SectionCard from "@/components/dashboard/SectionCard";
import { EmptyState, Spinner } from "@/components/UiFeedback";

const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500";

function Editor({ offer, onClose, onSaved }) {
  const { toast } = useToast();
  const [f, setF] = useState({
    title: offer.title || "", description: offer.description || "",
    discount_type: offer.discount_type, discount_value: offer.discount_value ?? 0,
    cashback_rate: offer.cashback_rate ?? 0, perk_label: offer.perk_label || "",
    booking_required: !!offer.booking_required, is_featured: !!offer.is_featured,
    expires_at: offer.expires_at ? offer.expires_at.slice(0, 10) : "",
    slug: offer.slug || "", seo_title: offer.seo_title || "", seo_description: offer.seo_description || "",
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!f.title.trim()) return toast({ title: "Titre requis", variant: "destructive" });
    if (f.discount_type === "PERK" && !f.perk_label.trim()) return toast({ title: "Décrivez le privilège offert", variant: "destructive" });
    setSaving(true);
    try {
      const updated = await entities.Offer.update(offer.id, {
        title: f.title.trim(), description: f.description.trim() || null,
        discount_type: f.discount_type, discount_value: Number(f.discount_value) || 0,
        cashback_rate: Number(f.cashback_rate) || 0,
        perk_label: f.discount_type === "PERK" ? f.perk_label.trim() : null,
        booking_required: f.booking_required, is_featured: f.is_featured,
        expires_at: f.expires_at ? new Date(f.expires_at + "T23:59:59").toISOString() : null,
        slug: f.slug || "", seo_title: f.seo_title.trim() || null, seo_description: f.seo_description.trim() || null,
      });
      onSaved({ ...offer, ...updated });
      toast({ title: "Offre mise à jour" });
      onClose();
    } catch (e) {
      toast({ title: "Échec", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="block text-sm"><span className="text-slate-500">Titre</span><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={input} /></label>
      <label className="block text-sm"><span className="text-slate-500">Description</span><textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm"><span className="text-slate-500">Type</span>
          <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })} className={input}>
            {DISCOUNT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select></label>
        <label className="block text-sm"><span className="text-slate-500">Valeur</span><input type="number" min={0} value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} className={input} /></label>
        <label className="block text-sm"><span className="text-slate-500">Cashback %</span><input type="number" min={0} max={100} value={f.cashback_rate} onChange={(e) => setF({ ...f, cashback_rate: e.target.value })} className={input} /></label>
      </div>
      {f.discount_type === "PERK" && (
        <label className="block text-sm"><span className="text-slate-500">Privilège offert</span><input value={f.perk_label} maxLength={120} onChange={(e) => setF({ ...f, perk_label: e.target.value })} className={input} /></label>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm"><span className="text-slate-500">Expire le</span><input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} className={input} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600"><input type="checkbox" checked={f.is_featured} onChange={(e) => setF({ ...f, is_featured: e.target.checked })} className="h-4 w-4 accent-amber-500" /> À la une</label>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600"><input type="checkbox" checked={f.booking_required} onChange={(e) => setF({ ...f, booking_required: e.target.checked })} className="h-4 w-4 accent-emerald-500" /> Réservation WhatsApp</label>
      </div>
      <SeoFields value={f} onChange={(v) => setF({ ...f, ...v })} fallbackTitle={f.title} fallbackDescription={f.description} basePath="/offre/" />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white"><X className="h-4 w-4" /> Annuler</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
        </button>
      </div>
    </div>
  );
}

/** Admin: every partner offer, editable (content, privilege, featuring, SEO). */
export default function AdminOffers() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const { data, loading, setData } = useAsync(async () => {
    const [offers, merchants] = await Promise.all([
      entities.Offer.list("-created_date", 500),
      entities.Merchant.list("-created_date", 500),
    ]);
    return { offers, merchants: Object.fromEntries(merchants.map((m) => [m.id, m])) };
  }, []);

  if (loading || !data) return <Spinner />;
  const needle = q.trim().toLowerCase();
  const rows = data.offers.filter((o) => !needle || `${o.title} ${data.merchants[o.merchant_id]?.name || ""}`.toLowerCase().includes(needle));
  const patch = (u) => setData((d) => ({ ...d, offers: d.offers.map((o) => (o.id === u.id ? u : o)) }));
  const remove = async (o) => {
    if (!confirm(`Supprimer « ${o.title} » ?`)) return;
    try {
      await entities.Offer.delete(o.id);
      setData((d) => ({ ...d, offers: d.offers.filter((x) => x.id !== o.id) }));
    } catch (e) {
      toast({ title: "Échec", description: e.message, variant: "destructive" });
    }
  };

  return (
    <SectionCard title="Offres des partenaires">
      <p className="mb-4 text-sm text-slate-500">Modifiez le contenu, le privilège et le référencement de toute offre, même après validation.</p>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une offre ou un partenaire" aria-label="Rechercher" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm" />
      </div>
      {rows.length === 0 ? <EmptyState icon={Search} title="Aucune offre" description="Aucune offre ne correspond." /> : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">{o.is_featured && <Star className="h-4 w-4 text-amber-500" />}{o.title}</p>
                  <p className="truncate text-xs text-slate-500">{data.merchants[o.merchant_id]?.name || "—"} · {offerBadge(o)} · <Link to={offerPath(o)} className="text-blue-600 hover:underline">voir</Link></p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(editing === o.id ? null : o.id)} aria-label="Modifier" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(o)} aria-label="Supprimer" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {editing === o.id && <Editor offer={o} onClose={() => setEditing(null)} onSaved={patch} />}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
