import React, { useState } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import LocationPicker from "@/components/map/LocationPicker";
import { useI18n } from "@/i18n/I18nContext";
import { Loader2 } from "lucide-react";

/** Lets a merchant place their own shop on the public partner map. */
export default function MerchantLocationCard({ merchant, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loc, setLoc] = useState({
    address: merchant?.address || "",
    city: merchant?.city || "",
    lat: merchant?.lat ?? null,
    lng: merchant?.lng ?? null,
  });
  const [saving, setSaving] = useState(false);
  if (!merchant) return null;
  const onMap = merchant.lat != null && merchant.lng != null;

  const save = async () => {
    if (loc.lat == null || loc.lng == null) {
      toast({ title: t("mc.loc.needPinTitle"), description: t("mc.loc.needPinDesc"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const updated = await entities.Merchant.update(merchant.id, {
        address: loc.address?.trim() || null,
        city: loc.city?.trim() || merchant.city,
        lat: Number(loc.lat),
        lng: Number(loc.lng),
      });
      onSaved?.(updated);
      toast({ title: t("mc.loc.savedTitle"), description: t("mc.loc.savedDesc") });
    } catch (e) {
      toast({ title: t("mc.loc.saveFailed"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t("mc.loc.title")}</h2>
          <p className="mt-1 max-w-prose text-sm text-slate-500">
            {t("mc.loc.desc")}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${onMap ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {onMap ? t("mc.loc.onMap") : t("mc.loc.notOnMap")}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-slate-600">
          {t("mc.loc.city")}
          <input value={loc.city} onChange={(e) => setLoc({ ...loc, city: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-3">
        <LocationPicker value={loc} onChange={setLoc} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#08261D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4A38] disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("mc.loc.save")}
        </button>
        {onMap && <Link to={`/merchant-map?m=${merchant.id}`} className="text-sm font-medium text-[#08261D] underline underline-offset-4">{t("mc.loc.viewPublic")}</Link>}
      </div>
    </section>
  );
}
