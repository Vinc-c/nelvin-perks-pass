import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";

/** Promotional banner managed from Admin → Marketing. Renders nothing when no live banner exists for the placement. */
export default function SiteBanner({ placement, className = "" }) {
  const { data } = useAsync(() => entities.SiteBanner.filter({ placement, active: true }, "sort_order", 5).catch(() => []), [placement], { initial: [] });
  const b = (data || [])[0];
  if (!b) return null;
  const external = b.cta_url?.startsWith("http");
  const cta = b.cta_label && b.cta_url && (external
    ? <a href={b.cta_url} rel="noopener noreferrer" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-[#E82B2C]">{b.cta_label} <ArrowRight className="h-4 w-4" /></a>
    : <Link to={b.cta_url} className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-[#E82B2C]">{b.cta_label} <ArrowRight className="h-4 w-4" /></Link>);
  return (
    <section className={`relative overflow-hidden rounded-[20px] bg-[#E82B2C] text-white ${className}`} aria-label={b.title}>
      {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
      {b.image_url && <span className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/10" />}
      <div className="relative max-w-xl p-6 sm:p-8">
        <h2 className="text-xl font-medium leading-tight sm:text-2xl">{b.title}</h2>
        {b.subtitle && <p className="mt-1.5 text-sm text-white/80">{b.subtitle}</p>}
        {cta}
      </div>
    </section>
  );
}
