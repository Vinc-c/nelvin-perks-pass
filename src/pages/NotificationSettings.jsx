import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import SectionCard from "@/components/dashboard/SectionCard";
import { useAuth } from "@/lib/AuthContext";
import { updateMe } from "@/api/auth";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { Bell, Mail, Smartphone, Save, Loader2 } from "lucide-react";

// Notification categories map to notifications.type. In-app notifications
// are always kept (they are the account history); these preferences control
// the live badge and which categories raise an alert.
const CATEGORIES = [
  { key: "CASHBACK" },
  { key: "RECHARGE" },
  { key: "REWARD" },
  { key: "ANNOUNCEMENT" },
  { key: "ALERT", locked: true },
];

function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${on ? "bg-emerald-500" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [push, setPush] = useState(true);
  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPush(user.notif_push !== false);
    setPrefs(user.notif_prefs || {});
  }, [user]);

  const enabled = (k) => prefs[k] !== false;

  const save = async () => {
    setSaving(true);
    try {
      await updateMe({ notif_push: push, notif_prefs: { ...prefs, ALERT: true } });
      await refreshUser();
      toast({ title: t("ac.notif.saved") });
    } catch (e) {
      toast({ title: t("ac.common.error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalLayout title={t("ac.set.notifLink")} theme="light">
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Bell} title={t("ac.notif.channels")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3"><Smartphone className="h-4 w-4 text-slate-400" /><div><p className="text-sm font-medium text-slate-900">{t("ac.notif.realtime")}</p><p className="text-xs text-slate-500">{t("ac.notif.realtimeDesc")}</p></div></div>
              <Toggle on={push} onChange={setPush} />
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("ac.notif.transactional", { email: user?.email || "" })}</p>
          </div>
        </SectionCard>

        <SectionCard icon={Bell} title={t("ac.notif.categories")}>
          <div className="space-y-3">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div><p className="text-sm font-medium text-slate-900">{t(`ac.notif.cat.${c.key}`)}</p><p className="text-xs text-slate-500">{t(`ac.notif.cat.${c.key}.desc`)}</p></div>
                <Toggle on={c.locked || enabled(c.key)} disabled={c.locked} onChange={(v) => setPrefs((p) => ({ ...p, [c.key]: v }))} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <button onClick={save} disabled={saving} className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("ac.common.save")}
      </button>
    </PortalLayout>
  );
}
