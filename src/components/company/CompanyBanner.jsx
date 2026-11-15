import React from "react";
import { useBranding, contrastOn } from "@/hooks/useBranding";

export function BannerView({ live }) {
  if (!live || (!live.banner_url && !live.welcome_title && !live.welcome_text)) return null;
  const bg = live.primary_color || "#0F4A38";
  const fg = contrastOn(bg);
  return (
    <section className="relative mb-5 overflow-hidden rounded-[20px]" style={{ backgroundColor: bg, color: fg }}>
      {live.banner_url && <img src={live.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
      {live.banner_url && <span className="absolute inset-0 bg-black/35" />}
      <div className="relative flex min-h-[132px] items-end gap-3 p-5" style={live.banner_url ? { color: "#fff" } : undefined}>
        {live.logo_url && <img src={live.logo_url} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-1.5" />}
        <div className="min-w-0">
          {live.welcome_title && <h2 className="text-lg font-medium leading-tight">{live.welcome_title}</h2>}
          {live.welcome_text && <p className="mt-1 text-sm opacity-85">{live.welcome_text}</p>}
        </div>
      </div>
      {live.accent_color && <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: live.accent_color }} />}
    </section>
  );
}

/** Company banner + welcome message on the employee Home (only for approved branding). */
export default function CompanyBanner() {
  const { live } = useBranding();
  return <BannerView live={live} />;
}
