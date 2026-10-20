import React from "react";
import { GLYPHS } from "./nvGlyphs";

/**
 * Nelvin's own icon set (duotone: current text colour + gold accent).
 * `tone="dark"` brightens the accent for use on emerald backgrounds.
 */
export default function NvIcon({ name, className = "h-6 w-6", tone = "light", label, strokeWidth = 1.6, faint }) {
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
      style={{ ...(tone === "dark" ? { "--nv-accent": "#E6CF8B" } : {}), ...(faint ? { opacity: faint } : {}) }}
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

// Lucide icon name -> Nelvin glyph, so pages written with generic icons pick
// up the brand icon automatically wherever a glyph exists.
const LUCIDE_TO_GLYPH = {
  Wallet: "WALLET", Gift: "PERK_GIFT", TrendingUp: "CASHBACK", Banknote: "FINANCIAL_WELLNESS", PiggyBank: "FINANCIAL_WELLNESS",
  Receipt: "FINANCIAL_WELLNESS", Users: "FAMILY_PARENTING", User: "FAMILY_PARENTING", UserCheck: "VERIFIED",
  ScanLine: "QR_CODE", QrCode: "QR_CODE", Trophy: "PASS_VIP", Award: "PASS_VIP", Crown: "PASS_VIP", Tag: "PERCENT",
  Star: "STAR_MARK", Store: "SHOPPING_RETAIL", Building2: "HOTELS_HOSPITALITY", Globe: "AFRICA", Smartphone: "TECHNOLOGY",
  Shield: "SHIELD_LOCK", ShieldCheck: "VERIFIED", Lock: "SHIELD_LOCK", KeyRound: "PIN_CODE", Check: "VERIFIED",
  CheckCircle2: "VERIFIED", Ticket: "ENTERTAINMENT", MapPin: "CITY_PIN", Download: "OFFLINE", Bell: "BELL", Clock: "CLOCK",
  MessageSquare: "CHAT", LifeBuoy: "CHAT", Headphones: "CHAT", FileText: "DOC", Sparkles: "SPARK", Percent: "PERCENT", Gem: "PASS_PREMIUM", Share2: "WHATSAPP", CreditCard: "PASS_FREE", Activity: "CASHBACK",
};
export const glyphFor = (Icon) => (Icon && LUCIDE_TO_GLYPH[Icon.displayName]) || null;

/** Renders the Nelvin glyph matching a lucide icon, or the lucide icon itself. */
export function BrandIcon({ icon: Icon, className, glyphClassName, tone }) {
  const g = glyphFor(Icon);
  if (g) return <NvIcon name={g} className={glyphClassName || className} tone={tone} />;
  return Icon ? <Icon className={className} /> : null;
}
