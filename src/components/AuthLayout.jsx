import React from "react";
import NelvinLogo from "@/components/NelvinLogo";

// Centered auth shell. The brand logo replaces the previous generic
// generated background image; the surface stays clean and on-brand.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,_#eef4ff_0%,_#f8fafc_45%,_#ffffff_100%)]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <NelvinLogo className="h-12" />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-card p-8 shadow-2xl shadow-slate-400/20">
          {children}
        </div>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}