import React from "react";
import { Link, useLocation } from "react-router-dom";
import { navHref, isNavActive } from "@/lib/portalNav";
import { BrandIcon } from "@/components/brand/NvIcon";

export default function PortalNavLinks({ items, onNavigate }) {
  const { pathname, search } = useLocation();
  return items.map((item, i) => {
    const Icon = item.icon;
    const active = isNavActive(item, pathname, search);
    const showGroup = item.group && item.group !== items[i - 1]?.group;
    return (
      <React.Fragment key={`${item.to}-${item.section || ""}-${i}`}>
        {showGroup && (
          <p className={`px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${i > 0 ? "pt-4" : ""}`}>
            {item.group}
          </p>
        )}
        <Link
          to={navHref(item)}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition ${
            active ? "bg-nv-ivory-2 font-semibold text-nv-deep ring-1 ring-nv-line" : "text-slate-600 hover:bg-nv-ivory"
          }`}
        >
          <BrandIcon icon={Icon} className="h-[18px] w-[18px] shrink-0" glyphClassName="h-[20px] w-[20px] shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      </React.Fragment>
    );
  });
}