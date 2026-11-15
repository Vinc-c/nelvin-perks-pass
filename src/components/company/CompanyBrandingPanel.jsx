import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Palette } from "lucide-react";
import { callRpc } from "@/api/rpc";
import { useBranding } from "@/hooks/useBranding";
import { useToast } from "@/components/ui/use-toast";
import ImageUploader from "@/components/admin/ImageUploader";
import { BannerView } from "@/components/company/CompanyBanner";

const STATUS_STYLE = {
  NONE: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};
const STATUS_LABEL = { NONE: "Not customised", PENDING: "Awaiting approval", APPROVED: "Live", REJECTED: "Changes requested" };

const EMPTY = { primary_color: "#0F4A38", accent_color: "#C8A24A", logo_url: "", banner_url: "", welcome_title: "", welcome_text: "" };

/** HR: customise the company dashboard (Growth & Enterprise). Changes go live after the Nelvin marketing team approves them. */
export default function CompanyBrandingPanel() {
  const { branding, ready, reload } = useBranding();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!branding) return;
    setForm({ ...EMPTY, ...(branding.live || {}), ...(branding.pending || {}) });
  }, [branding]);

  if (!ready) return <Loader2 className="h-5 w-5 animate-spin text-slate-400" />;
  if (!branding?.eligible) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-nv-gold/15 text-nv-bronze"><Lock className="h-6 w-6" strokeWidth={1.5} /></span>
        <h2 className="mt-3 text-lg font-medium text-slate-900">Dashboard customisation</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Add your logo, colours, banner and welcome message to your employees' dashboard. Available on the Growth and Enterprise plans.</p>
        <Link to="/billing-settings" className="mt-4 inline-flex h-11 items-center rounded-xl bg-nv-emerald px-6 text-sm font-medium text-white">View plans</Link>
      </div>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await callRpc("submit_company_branding", { p: form });
      toast({ title: "Sent to the Nelvin team", description: "Your changes go live once approved." });
      await reload();
    } catch (err) {
      toast({ title: "Could not submit", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const status = branding.status || "NONE";

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[20px] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-medium text-slate-900"><Palette className="h-5 w-5 text-nv-emerald" strokeWidth={1.5} /> Dashboard customisation</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
      </div>
      {status === "REJECTED" && branding.review_note && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Marketing team note: {branding.review_note}</p>}
      {status === "PENDING" && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Your proposal is being reviewed by the Nelvin marketing team. Your employees keep seeing the current version until it is approved.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Brand colour
          <div className="mt-1.5 flex items-center gap-2">
            <input type="color" value={form.primary_color || "#0F4A38"} onChange={set("primary_color")} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" aria-label="Brand colour" />
            <input value={form.primary_color || ""} onChange={set("primary_color")} maxLength={7} className="h-10 w-28 rounded-lg border border-slate-300 px-2 font-mono text-sm" aria-label="Brand colour hex" />
          </div>
        </label>
        <label className="text-sm font-medium text-slate-700">Accent colour
          <div className="mt-1.5 flex items-center gap-2">
            <input type="color" value={form.accent_color || "#C8A24A"} onChange={set("accent_color")} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1" aria-label="Accent colour" />
            <input value={form.accent_color || ""} onChange={set("accent_color")} maxLength={7} className="h-10 w-28 rounded-lg border border-slate-300 px-2 font-mono text-sm" aria-label="Accent colour hex" />
          </div>
        </label>
        <ImageUploader label="Company logo (square, PNG/JPG)" value={form.logo_url} onChange={set("logo_url")} />
        <ImageUploader label="Banner image (wide, 1600×600)" value={form.banner_url} onChange={set("banner_url")} />
      </div>
      <label className="block text-sm font-medium text-slate-700">Welcome title
        <input value={form.welcome_title || ""} onChange={set("welcome_title")} maxLength={80} placeholder="Welcome to your benefits" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Welcome message
        <textarea value={form.welcome_text || ""} onChange={set("welcome_text")} maxLength={280} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm" />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Preview</p>
        <BannerView live={form} />
      </div>
      <button type="submit" disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-nv-emerald px-6 text-sm font-medium text-white disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit for approval
      </button>
    </form>
  );
}
