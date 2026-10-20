import React from "react";
import NvIcon from "@/components/brand/NvIcon";

/** Round medal for reward badges: gold when earned, muted when still locked. */
export default function BadgeMedal({ glyph, earned = true, className = "h-12 w-12", iconClassName = "h-6 w-6" }) {
  return earned ? (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nv-gold-light via-nv-gold to-nv-bronze p-[2px] shadow ${className}`}>
      <span className="flex h-full w-full items-center justify-center rounded-full bg-nv-deep text-white">
        <NvIcon name={glyph} tone="dark" className={iconClassName} />
      </span>
    </span>
  ) : (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-nv-ivory-2 text-nv-muted/50 ring-1 ring-nv-line ${className}`}>
      <NvIcon name={glyph} className={iconClassName} />
    </span>
  );
}
