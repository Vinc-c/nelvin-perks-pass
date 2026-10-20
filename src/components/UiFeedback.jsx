import React from "react";
import { Loader2 } from "lucide-react";
import NvIcon, { glyphFor } from "@/components/brand/NvIcon";

/* Friendly, consistent empty state with optional CTA */
export function EmptyState({ icon: Icon, glyph, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-nv-line bg-white px-6 py-12 text-center">
      {(glyph || Icon) && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nv-ivory-2 text-nv-emerald ring-1 ring-nv-line">
          {glyph || glyphFor(Icon) ? <NvIcon name={glyph || glyphFor(Icon)} className="h-8 w-8" /> : <Icon className="h-6 w-6 text-slate-400" />}
        </div>
      )}
      {title && <p className="mt-4 font-semibold text-nv-ink">{title}</p>}
      {description && <p className="mt-1 max-w-sm text-sm text-nv-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Consistent centered spinner for loading regions */
export function Spinner({ className = "h-6 w-6 text-slate-400", label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
      <Loader2 className={`${className} animate-spin`} />
      {label && <p className="text-xs">{label}</p>}
    </div>
  );
}

/* Shimmering skeleton rows for list/table loading */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-1/4 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}