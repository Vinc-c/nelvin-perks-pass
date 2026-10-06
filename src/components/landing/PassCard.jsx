import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import KenteBand from "@/components/brand/KenteBand";
import { NelvinMark } from "@/components/NelvinLogo";

/**
 * The membership pass as the hero object. The QR code is real: it opens
 * Nelvin on the phone that scans it.
 */
export default function PassCard({ holder }) {
  const ref = useRef(null);
  const url = `${window.location.origin}/app`;
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const tilt = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = ""; };

  return (
    <div onPointerMove={tilt} onPointerLeave={reset} className="mx-auto w-full max-w-[420px]">
      <div ref={ref} className="nv-motion relative aspect-[1.586/1] overflow-hidden rounded-[22px] bg-[#0E1A3B] text-white shadow-[0_30px_60px_-20px_rgba(14,26,59,.6)] ring-1 ring-white/10 transition-transform duration-200 ease-out">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(212,161,58,.35),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0"><KenteBand height={18} /></div>
        <div className="relative flex h-full flex-col justify-between p-5 pt-9 sm:p-6 sm:pt-10">
          <div className="flex items-center gap-2">
            <NelvinMark className="h-10 w-10" />
            <span className="nv-display text-lg font-semibold tracking-tight">Nelvin Pass</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-white/60">Membre</p>
              <p className="nv-display truncate text-base font-medium sm:text-lg">{holder || "Votre nom ici"}</p>
              <p className="mt-2 text-xs text-[#D4A13A]">Valable chez tous les partenaires Nelvin</p>
            </div>
            <div className="shrink-0 rounded-xl bg-white p-2" title="Scannez pour ouvrir Nelvin sur votre téléphone">
              <QRCodeSVG value={url} size={84} level="M" bgColor="#ffffff" fgColor="#0E1A3B" aria-label="QR code : ouvrir Nelvin sur votre téléphone" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-white/60">Scannez le code avec l'appareil photo de votre téléphone pour ouvrir Nelvin.</p>
    </div>
  );
}
