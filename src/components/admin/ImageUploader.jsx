import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, X } from "lucide-react";

// Public upload — marketing/brand images shown publicly across the site.
export default function ImageUploader({ value, onChange, label = "Image" }) {
  const [busy, setBusy] = useState(false);
  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="mt-1.5 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {value ? "Remplacer" : "Téléverser"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {value && (
          <div className="flex items-center gap-2">
            <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover" />
            <button type="button" onClick={() => onChange("")} className="text-slate-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}