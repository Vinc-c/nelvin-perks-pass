import React, { useEffect, useState } from "react";
import { uploadPublicFile } from "@/api/storage";
import { motion, AnimatePresence } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/roles";
import { useToast } from "@/components/ui/use-toast";
import { DISCOUNT_TYPES, AUDIENCES } from "@/data/offerCategories";
import { useCategories } from "@/hooks/useCategories";
import { Image as ImageIcon, Plus, Pencil, Trash2, X, Loader2, Star, Tag, Upload, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/UiFeedback";
import RoleWelcomeHeader from "@/components/RoleWelcomeHeader";
import SeoFields from "@/components/seo/SeoFields";

const EMPTY = {
  title: "",
  description: "",
  category: "FOOD_DINING",
  discount_type: "PERCENTAGE",
  discount_value: 10,
  cashback_rate: 0,
  target_audience: "ALL",
  image_url: "",
  expires_at: "",
  is_featured: false,
  usage_limit: "",
  usage_period: "YEAR",
  perk_label: "",
  booking_required: false,
  slug: "",
  seo_title: "",
  seo_description: "",
};

export default function CampaignEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const merchantId = user?.merchant_id;
  const { categories, meta } = useCategories();

  const [offers, setOffers] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!merchantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [off, red] = await Promise.all([
        entities.Offer.filter({ merchant_id: merchantId }, "-created_date", 100),
        entities.Redemption.filter({ merchant_id: merchantId }, "-created_date", 200),
      ]);
      setOffers(off || []);
      setRedemptions(red || []);
    } catch {
      setOffers([]); setRedemptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();   }, [merchantId]);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (o) => {
    setForm({
      title: o.title || "",
      description: o.description || "",
      category: o.category || "FOOD_DINING",
      discount_type: o.discount_type || "PERCENTAGE",
      discount_value: o.discount_value ?? 10,
      cashback_rate: o.cashback_rate ?? 0,
      target_audience: o.target_audience || "ALL",
      image_url: o.image_url || "",
      expires_at: o.expires_at ? o.expires_at.slice(0, 10) : "",
      is_featured: !!o.is_featured,
      usage_limit: o.usage_limit ?? "",
      usage_period: o.usage_period || "YEAR",
      perk_label: o.perk_label || "",
      booking_required: !!o.booking_required,
      slug: o.slug || "",
      seo_title: o.seo_title || "",
      seo_description: o.seo_description || "",
    });
    setEditing(o.id);
  };

  const onUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadPublicFile(file, "offers");
      setForm((f) => ({ ...f, image_url: file_url }));
      toast({ title: "Image téléversée", description: "Votre visuel d'offre est prêt." });
    } catch {
      toast({ title: "Échec du téléversement", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Titre requis", variant: "destructive" }); return; }
    if (form.discount_type === "PERK" && !form.perk_label.trim()) { toast({ title: "Décrivez le privilège offert", description: "Ex. Dessert offert, surclassement de chambre, accès VIP.", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      merchant_id: merchantId,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      cashback_rate: Number(form.cashback_rate) || 0,
      target_audience: form.target_audience,
      image_url: form.image_url || "",
      expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59").toISOString() : null,
      is_featured: !!form.is_featured,
      usage_limit: form.usage_limit === "" || form.usage_limit == null ? null : Math.max(1, Math.round(Number(form.usage_limit))),
      usage_period: form.usage_period || "YEAR",
      perk_label: form.discount_type === "PERK" ? form.perk_label.trim() : null,
      booking_required: !!form.booking_required,
      slug: form.slug || "",
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
    };
    try {
      if (editing === "new") {
        await entities.Offer.create(payload);
        toast({ title: "Offre publiée", description: "Votre offre est maintenant visible par les membres." });
      } else {
        await entities.Offer.update(editing, payload);
        toast({ title: "Offre mise à jour" });
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: "Échec de l'enregistrement", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette offre ? Les codes générés ne pourront plus être validés.")) return;
    try {
      await entities.Offer.delete(id);
      toast({ title: "Offre supprimée" });
      await load();
    } catch (e) {
      toast({ title: "Échec", description: e.message, variant: "destructive" });
    }
  };

  const dType = DISCOUNT_TYPES.find((d) => d.value === form.discount_type);

  return (
    <PortalLayout title="Gestion des offres" theme="light">
      <RoleWelcomeHeader />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes offres & campagnes</h1>
          <p className="text-sm text-slate-500">Créez, modifiez et publiez vos offres avec visuel et catégorie.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 not-pill rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 active:scale-95">
          <Plus className="h-4 w-4" /> Nouvelle offre
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : offers.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Tag} title="Aucune offre" description="Publiez votre première offre pour attirer des membres." action={
            <button onClick={openNew} className="not-pill rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">+ Créer une offre</button>
          } />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o, i) => {
            const cmeta = meta(o.category);
            const reds = (redemptions || []).filter((r) => r.offer_id === o.id);
            const redeemed = reds.filter((r) => r.status === "REDEEMED").length;
            const active = !o.expires_at || new Date(o.expires_at) >= new Date();
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-32 bg-slate-100">
                  {o.image_url ? (
                    <img src={o.image_url} alt={o.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>
                  )}
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">{cmeta.label}</span>
                  {o.is_featured && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white"><Star className="h-3 w-3" /> À la une</span>}
                  <span className={`absolute bottom-3 right-3 rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>{active ? "Active" : "Expirée"}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{o.title}</h3>
                  {o.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{o.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                      {o.discount_type === "PERK" ? (o.perk_label || "Privilège") : o.discount_type === "FIXED" ? `-${o.discount_value} $` : `${o.discount_value}%${o.discount_type === "CASHBACK" ? " cashback" : ""}`}
                    </span>
                    {o.cashback_rate > 0 && <span className="rounded-lg bg-amber-50 px-2 py-1 font-medium text-amber-700">{o.cashback_rate}% cashback</span>}
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">{o.target_audience === "ALL" ? "Tous" : o.target_audience === "B2C" ? "Particuliers" : "Employés"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> {redeemed} échange{redeemed > 1 ? "s" : ""}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(o)} className="not-pill rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(o.id)} className="not-pill rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
            <motion.div
              initial={{ y: 40, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Tag className="h-5 w-5 text-emerald-600" /> {editing === "new" ? "Nouvelle offre" : "Modifier l'offre"}</h3>
                <button onClick={() => setEditing(null)} className="not-pill rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Image upload */}
                <div>
                  <label className="text-sm text-slate-500">Visuel de l'offre</label>
                  <div className="mt-1">
                    {form.image_url ? (
                      <div className="relative h-36 overflow-hidden rounded-xl border border-slate-200">
                        <img src={form.image_url} alt="preview" className="h-full w-full object-cover" />
                        <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="not-pill absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-emerald-400">
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-500" /> : <Upload className="h-6 w-6 text-slate-400" />}
                        <span className="mt-2 text-sm text-slate-500">{uploading ? "Téléversement…" : "Cliquez pour téléverser une image"}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                      </label>
                    )}
                  </div>
                </div>

                <label className="block text-sm">
                  <span className="text-slate-500">Titre</span>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Menu déjeuner -20%" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                </label>

                <label className="block text-sm">
                  <span className="text-slate-500">Description</span>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Détails de l'offre, conditions…" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                </label>

                {/* Category */}
                <div>
                  <span className="text-sm text-slate-500">Catégorie</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })} className={`not-pill rounded-full px-3 py-1.5 text-xs font-medium transition ${form.category === c.value ? "bg-emerald-500 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount + cashback */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-slate-500">Type de remise</span>
                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none">
                      {DISCOUNT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-500">Valeur {form.discount_type === "FIXED" ? "(USD)" : form.discount_type === "PERK" ? "(valeur estimée du privilège, USD — déduite de l'addition)" : dType?.suffix ? `(${dType.suffix})` : ""}</span>
                    <input type="number" min={0} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                </div>

                {form.discount_type === "PERK" && (
                  <label className="block text-sm">
                    <span className="text-slate-500">Privilège offert aux membres</span>
                    <input value={form.perk_label} maxLength={120} onChange={(e) => setForm({ ...form, perk_label: e.target.value })} placeholder="Ex. Dessert offert, surclassement de chambre, accès salon VIP" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                )}
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form.booking_required} onChange={(e) => setForm({ ...form, booking_required: e.target.checked })} className="mt-0.5 h-4 w-4 accent-emerald-500" />
                  <span>Réservation recommandée : le membre vous écrit sur WhatsApp avant de venir.</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-slate-500">Cashback membre (% du montant payé)</span>
                    <input type="number" min={0} max={100} value={form.cashback_rate} onChange={(e) => setForm({ ...form, cashback_rate: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-500">Audience</span>
                    <select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none">
                      {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-slate-500">Utilisations par membre (vide = illimité)</span>
                    <input type="number" min={1} max={1000} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder={form.discount_type === "PERK" ? "Conseillé : 1" : "Illimité"} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-500">Période</span>
                    <select value={form.usage_period} onChange={(e) => setForm({ ...form, usage_period: e.target.value })} disabled={form.usage_limit === ""} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none disabled:opacity-50">
                      <option value="DAY">Par jour</option>
                      <option value="WEEK">Par semaine</option>
                      <option value="MONTH">Par mois</option>
                      <option value="YEAR">Par an</option>
                      <option value="LIFETIME">Au total</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    <span className="text-slate-500">Expire le</span>
                    <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-500" />
                  </label>
                  {isAdmin(user) ? (
                    <label className="flex items-end gap-2 pb-2 text-sm text-slate-600">
                      <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 accent-amber-500" />
                      Mettre en avant (À la une)
                    </label>
                  ) : (
                    <p className="pb-2 text-xs text-slate-400">La mise en avant « À la une » est attribuée par l'équipe Nelvin.</p>
                  )}
                </div>
              </div>

              <details className="mt-4 rounded-xl border border-slate-200 p-3" open={!!(form.seo_title || form.seo_description)}>
                <summary className="cursor-pointer text-sm font-medium text-slate-700">Référencement de l'offre (SEO)</summary>
                <div className="mt-3">
                  <SeoFields value={form} onChange={(v) => setForm({ ...form, ...v })} fallbackTitle={form.title} fallbackDescription={form.description} basePath="/offre/" />
                </div>
              </details>

              <div className="mt-6 flex gap-2">
                <button onClick={() => setEditing(null)} className="not-pill flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button onClick={save} disabled={saving} className="not-pill flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Publier l'offre"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalLayout>
  );
}