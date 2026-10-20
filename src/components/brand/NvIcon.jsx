import React from "react";
import { GLYPHS } from "./nvGlyphs";

/**
 * Nelvin's own icon set (duotone: current text colour + gold accent).
 * `tone="dark"` brightens the accent for use on emerald backgrounds.
 */
export default function NvIcon({ name, className = "h-6 w-6", tone = "light", label, strokeWidth = 1.6 }) {
  const body = GLYPHS[name];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={tone === "dark" ? { "--nv-accent": "#E6CF8B" } : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      // Static, first-party constant markup (see nvGlyphs.js).
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Icon for an offer category (falls back to the star mark). */
export function CategoryIcon({ category, ...props }) {
  return <NvIcon name={GLYPHS[category] ? category : "STAR_MARK"} {...props} />;
}

export const hasGlyph = (name) => Boolean(GLYPHS[name]);
