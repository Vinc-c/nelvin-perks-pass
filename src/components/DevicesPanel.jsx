import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Smartphone, Trash2 } from "lucide-react";
import { callRpc } from "@/api/rpc";
import { useI18n } from "@/i18n/I18nContext";
import { getDeviceId } from "@/lib/device";

/** Active devices of the signed-in account with a "remove" action (max 4 devices). */
export default function DevicesPanel({ devices: initial = null, onChanged }) {
  const { t, locale } = useI18n();
  const [devices, setDevices] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const me = getDeviceId();

  const load = useCallback(async () => {
    try { setDevices(await callRpc("list_my_devices")); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { if (!initial) load(); }, [initial, load]);

  const remove = async (id) => {
    setBusy(id); setError("");
    try {
      await callRpc("remove_my_device", { p_device_id: id });
      setDevices((d) => (d || []).filter((x) => x.device_id !== id));
      onChanged?.();
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  };

  if (!devices) return <div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></div>;
  return (
    <div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {devices.map((d) => (
          <li key={d.device_id} className="flex items-center gap-3 px-3 py-2.5">
            <Smartphone className="h-5 w-5 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {d.label || t("dev.unknown")} {d.device_id === me && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t("dev.current")}</span>}
              </p>
              {d.last_seen && <p className="text-xs text-slate-400">{t("dev.lastSeen", { date: new Date(d.last_seen).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) })}</p>}
            </div>
            {d.device_id !== me && (
              <button onClick={() => remove(d.device_id)} disabled={!!busy} aria-label={t("dev.remove")} className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                {busy === d.device_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {t("dev.remove")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
