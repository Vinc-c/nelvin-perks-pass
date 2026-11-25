import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import { NETWORKS } from "@/components/landing/SocialLinks";
import { useQueryClient } from "@tanstack/react-query";

const OPTIONS = [
  ["google", "Google", "Works today (already configured)."],
  ["apple", "Apple", "Also enable Apple in Supabase → Authentication → Providers (Services ID, Team ID, key). Turn on only once done."],
  ["phone", "Phone (SMS code)", "Also enable Phone in Supabase → Authentication → Providers and connect an SMS provider (Twilio). Turn on only once done."],
];

/** Super admin: footer social links and which login options are shown. */
export default function AdminSocialLogin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [links, setLinks] = useState(null);
  const [prov, setProv] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("platform_settings").select("key,value").in("key", ["social_links", "auth_providers"]);
    const m = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    setLinks(m.social_links || {});
    setProv({ google: 1, apple: 0, phone: 0, ...(m.auth_providers || {}) });
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (name, fn, ok) => {
    setBusy(name);
    try { await fn(); toast({ title: ok }); qc.invalidateQueries({ queryKey: ["platform-setting"] }); await load(); }
    catch (e) { toast({ title: e.message, variant: "destructive" }); }
    finally { setBusy(""); }
  };

  if (!links || !prov) return <Spinner />;
  const inp = "nv-focus w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Social & login</h2>
        <p className="text-sm text-slate-500">Footer social icons and sign-in options. Changes are live immediately and logged.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Social media links</h3>
        <p className="mb-4 text-sm text-slate-500">An icon appears in the site footer only for networks with a link. Leave empty to hide. Links must be https:// and point to the network's own site.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {NETWORKS.map(({ id, label, Icon, placeholder }) => (
            <label key={id} className="block text-sm text-slate-700">
              <span className="mb-1 flex items-center gap-2 font-medium"><Icon className="h-4 w-4" />{label}</span>
              <input className={inp} type="url" inputMode="url" placeholder={placeholder} value={links[id] || ""} onChange={(e) => setLinks({ ...links, [id]: e.target.value })} />
            </label>
          ))}
        </div>
        <button disabled={busy === "links"} onClick={() => save("links", () => callRpc("admin_set_social_links", { p_links: links }), "Social links saved")}
          className="nv-focus mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Save links</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Login options</h3>
        <p className="mb-4 text-sm text-slate-500">Email and password is always available. Choose what else appears on the login and sign-up pages.</p>
        <ul className="space-y-3">
          {OPTIONS.map(([id, label, note]) => (
            <li key={id} className="flex items-start gap-3">
              <input id={`opt-${id}`} type="checkbox" className="mt-1 h-4 w-4" checked={!!prov[id]} onChange={(e) => setProv({ ...prov, [id]: e.target.checked ? 1 : 0 })} />
              <label htmlFor={`opt-${id}`} className="text-sm"><span className="font-medium text-slate-900">{label}</span><span className="block text-slate-500">{note}</span></label>
            </li>
          ))}
        </ul>
        <button disabled={busy === "prov"} onClick={() => save("prov", () => callRpc("admin_set_auth_providers", { p_providers: prov }), "Login options saved")}
          className="nv-focus mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Save login options</button>
      </div>
    </div>
  );
}
