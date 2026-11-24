import React, { useState } from "react";
import { uploadMediaFile, videoPosterBlob } from "@/api/storage";
import { Upload, Loader2, X, Film } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/** Admin upload of a landscape image or video. For a video it also stores a poster frame. */
export default function MediaUploader({ value, onChange, label = "Image or video" }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const pick = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await uploadMediaFile(file);
      let poster_url = "";
      if (up.media_type === "video") {
        const { blob, width, height } = await videoPosterBlob(file);
        if (width < height) toast({ title: "This video is portrait", description: "The hero is landscape: it will be cropped. Prefer 16:9.", variant: "destructive" });
        poster_url = (await uploadMediaFile(new File([blob], "poster.jpg", { type: "image/jpeg" }), "hero/posters")).file_url;
      }
      onChange({ url: up.file_url, media_type: up.media_type, poster_url });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : value?.url ? "Replace" : "Upload"}
          <input type="file" accept="video/mp4,video/webm,image/png,image/jpeg,image/webp,image/avif" className="hidden" disabled={busy} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {value?.url && (
          <div className="flex items-center gap-2">
            {value.media_type === "video" ? <span className="flex h-10 w-16 items-center justify-center overflow-hidden rounded-lg bg-slate-900">{value.poster_url ? <img src={value.poster_url} alt="" className="h-full w-full object-cover" /> : <Film className="h-4 w-4 text-white" />}</span> : <img src={value.url} alt="" className="h-10 w-16 rounded-lg object-cover" />}
            <span className="text-xs text-slate-500">{value.media_type === "video" ? "Video ready" : "Image ready"}</span>
            <button type="button" onClick={() => onChange({ url: "", media_type: "image", poster_url: "" })} className="text-slate-400 hover:text-rose-500" aria-label="Remove"><X className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">Landscape 16:9. Video: MP4 (H.264) or WebM, 5 MB max, up to 3 hero videos, ideally 5–10 s, no sound needed. Image: up to 10 MB.</p>
    </div>
  );
}
