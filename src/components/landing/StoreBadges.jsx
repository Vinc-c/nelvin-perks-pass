import React from "react";

/* Apple logo (official silhouette) */
const AppleMark = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C3.3 17 2.46 12.45 4.11 9.78c.83-1.34 2.3-2.18 3.87-2.18 1.35 0 2.09.79 3.16.79 1.03 0 1.66-.79 3.15-.79 1.4 0 2.88.76 3.94 2.08-3.47 1.94-2.91 6.98.53 8.62zM13.6 6.3c.66-.8 1.17-1.94 1.02-3.08-1.01.04-2.22.67-2.94 1.49-.64.72-1.2 1.88-1.05 2.99 1.13.09 2.28-.57 2.97-1.4z" />
  </svg>
);

/* Google Play mark — 4-color play triangle in Google brand colors */
const GooglePlayMark = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <path fill="#4285F4" d="M10 15 L10 50 L85 50 Z" />
    <path fill="#EA4335" d="M10 85 L10 50 L85 50 Z" />
    <path fill="#FBBC04" d="M10 50 L85 50 L80 70 L18 70 Z" opacity="0" />
    <path fill="#34A853" d="M85 50 L98 57 L98 43 Z" />
  </svg>
);

const Badge = ({ mark, line1, line2, href = "#" }) => (
  <a
    href={href}
    className="not-pill inline-flex items-center gap-3 rounded-xl bg-brand px-4 py-2.5 text-white shadow-md transition hover:bg-brand"
  >
    {mark}
    <span className="flex flex-col leading-tight">
      <span className="text-[9px] font-medium uppercase tracking-wide text-white/70">{line1}</span>
      <span className="text-sm font-semibold">{line2}</span>
    </span>
  </a>
);

export default function StoreBadges({ className = "" }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <Badge
        mark={<AppleMark className="h-6 w-6" />}
        line1="Download on the"
        line2="App Store"
      />
      <Badge
        mark={<GooglePlayMark className="h-6 w-6" />}
        line1="Get it on"
        line2="Google Play"
      />
    </div>
  );
}