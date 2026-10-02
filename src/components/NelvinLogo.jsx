import React from "react";
import { Image } from "@/components/ui/image";

// Official Nelvin brand assets.
// NELVIN_LOGO — full lockup (gold icon + "NelvinBenefits" wordmark), transparent
//               background. Use on light surfaces.
// NELVIN_ICON — gold icon mark only. Use on dark surfaces where the navy
//               wordmark wouldn't be legible.
export const NELVIN_LOGO =
  "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/1b0d25031_07_NelvinBenefits.svg";
export const NELVIN_ICON =
  "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/3f8e302cf_05_Icon_Only_App_Favicon.png";

// Full brand lockup (icon + "NelvinBenefits"). Pass a height class, e.g. "h-8".
export default function NelvinLogo({ className = "h-8" }) {
  return <Image src={NELVIN_LOGO} alt="Nelvin Benefits" fittingType="fit" className={className} />;
}

// Gold icon mark only — for dark backgrounds.
export function NelvinMark({ className = "h-9 w-9" }) {
  return <Image src={NELVIN_ICON} alt="Nelvin" fittingType="fit" className={className} />;
}