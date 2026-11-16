import React from "react";

/** Full-screen loader: the Nelvin logo with a ring turning around it. Same look as the splash in index.html. */
export default function SplashLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white" role="status" aria-label="Loading">
      <div className="relative h-24 w-24">
        <span className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-nv-emerald motion-safe:animate-spin" />
        <img src="/images/nelvin-icon-192.png" alt="" className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] rounded-2xl object-contain" />
      </div>
    </div>
  );
}
