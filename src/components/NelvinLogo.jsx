import React from "react";
import { Image } from "@/components/ui/image";

// Official Nelvin brand assets.
// NELVIN_LOGO — full lockup (gold icon + "NelvinBenefits" wordmark), transparent
//               background. Use on light surfaces.
// NELVIN_ICON — gold icon mark only. Use on dark surfaces where the navy
//               wordmark wouldn't be legible.
export const NELVIN_LOGO =
  "/images/nelvin-logo.svg";
export const NELVIN_ICON =
  "/images/nelvin-icon-512.png";

// Full brand lockup (icon + "NelvinBenefits"). Pass a height class, e.g. "h-8".
export default function NelvinLogo({ className = "h-8" }) {
  return <Image src={NELVIN_LOGO} alt="Nelvin Benefits" fittingType="fit" className={className} />;
}

// Gold icon mark only — for dark backgrounds.
export function NelvinMark({ className = "h-9 w-9" }) {
  return <Image src={NELVIN_ICON} alt="Nelvin" fittingType="fit" className={className} />;
}