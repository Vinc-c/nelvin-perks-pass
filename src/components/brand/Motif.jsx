import React, { useId } from "react";
import { categoryHues } from "@/data/offerCategories";

/** Small woven swatch identifying a category (replaces emoji icons). */
export default function Motif({ category, className = "h-10 w-10", rounded = "rounded-lg" }) {
  const id = useId().replace(/:/g, "");
  const [c1, c2] = categoryHues(category);
  // A different weave per category, derived from its name.
  const seed = [...String(category || "")].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const kind = seed % 3;
  return (
    <span className={`inline-block overflow-hidden ${rounded} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <defs>
          <pattern id={`m${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={c1} />
            {kind === 0 && <path d="M0 10 L5 0 L10 10" stroke={c2} strokeWidth="1.6" fill="none" />}
            {kind === 1 && <><rect x="0" y="0" width="5" height="5" fill={c2} /><rect x="5" y="5" width="5" height="5" fill={c2} /></>}
            {kind === 2 && <><rect x="0" y="3.5" width="10" height="3" fill={c2} /><rect x="3.5" y="0" width="3" height="10" fill={c2} opacity="0.6" /></>}
          </pattern>
        </defs>
        <rect width="40" height="40" fill={`url(#m${id})`} />
      </svg>
    </span>
  );
}
