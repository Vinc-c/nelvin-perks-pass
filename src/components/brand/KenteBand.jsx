import React, { useId } from "react";
import { NV } from "@/data/offerCategories";

/**
 * Woven band inspired by strip-weaving (kente / aso-oke): blocks of brand
 * colours, warp lines and a zig-zag weft, drawn as a repeating SVG pattern.
 * Original motif — decorative only.
 */
export default function KenteBand({ height = 28, className = "", variant = "night" }) {
  const id = useId().replace(/:/g, "");
  const base = variant === "gold" ? NV.gold : NV.night;
  const a = variant === "gold" ? NV.night : NV.gold;
  return (
    <svg className={`block w-full ${className}`} height={height} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`k${id}`} width="96" height={height} patternUnits="userSpaceOnUse">
          <rect width="96" height={height} fill={base} />
          <rect x="0" y="0" width="22" height={height} fill={a} />
          <rect x="22" y="0" width="4" height={height} fill={NV.malachite} />
          <rect x="30" y="0" width="14" height={height} fill={NV.indigo} />
          <rect x="48" y="0" width="22" height={height} fill={a} />
          <rect x="74" y="0" width="4" height={height} fill={NV.clay} />
          {[4, 8, 12, 16].map((x) => <rect key={x} x={x} y="0" width="1.5" height={height} fill={base} opacity="0.55" />)}
          <path d={`M30 ${height / 2} l3.5 -4 l3.5 4 l3.5 -4 l3.5 4`} stroke={a} strokeWidth="1.6" fill="none" />
          <path d={`M48 ${height * 0.25} h22 M48 ${height * 0.75} h22`} stroke={base} strokeWidth="2" />
          <circle cx="86" cy={height / 2} r="3" fill={a} />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#k${id})`} />
    </svg>
  );
}
