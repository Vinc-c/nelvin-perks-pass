import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { NelvinMark } from "@/components/NelvinLogo";
import KenteBand from "@/components/brand/KenteBand";
import NvIcon from "@/components/brand/NvIcon";

const TIERS = {
  PASS_FREE: { label: "Member", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_BASIC: { label: "Pass Basic", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_PREMIUM: { label: "Pass Premium", glyph: "PASS_PREMIUM", bg: "from-nv-deep via-nv-emerald to-nv-deep", ring: "ring-nv-gold/60" },
  PASS_VIP: { label: "VIP Gold", glyph: "PASS_VIP", bg: "from-[#0B1612] via-[#14201B] to-nv-deep", ring: "ring-nv-gold" },
};

/**
 * Digital membership card. `illustration` shows a placeholder holder so the
 * marketing version never looks like a real person's card.
 */
export default function NelvinPassCard({ tier = "PASS_PREMIUM", name, code, qrValue, showQr = true, illustration = false, className = "" }) {
  const t = TIERS[tier] || TIERS.PASS_FREE;
  const holder = name || (illustration ? "YOUR NAME" : "MEMBER");
  const shown = code || (illustration ? "NLV · 0000 0000" : "");
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${t.bg} p-5 text-white shadow-2xl shadow-nv-deep/40 ring-1 ${t.ring} ${className}`}
      role="img"
      aria-label={`Carte Nelvin ${t.label}${illustration ? " (illustration)" : ""}`}
    >
      <NvIcon name="AFRICA" tone="dark" className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-nv-gold" faint={0.15} strokeWidth={0.5} />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <NelvinMark className="h-9 w-9" />
          <span className="text-sm font-bold tracking-wide">Nelvin</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-2 pr-3 text-[11px] font-semibold text-nv-gold-light ring-1 ring-white/15">
          <NvIcon name={t.glyph} tone="dark" className="h-4 w-4 text-nv-gold-light" /> {t.label}
        </span>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Titulaire</p>
          <p className="truncate text-lg font-bold tracking-wide">{holder}</p>
          {shown && <p className="mt-1 font-mono text-xs tracking-widest text-nv-gold-light">{shown}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
            <NvIcon name="VERIFIED" tone="dark" className="h-4 w-4 text-nv-gold-light" /> Valable chez tous les partenaires vérifiés
          </p>
        </div>
        {showQr && (
          <div className="shrink-0 rounded-xl bg-white p-1.5">
            <QRCodeSVG value={qrValue || "https://nelvin.app"} size={64} level="M" fgColor="#08261D" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 opacity-90"><KenteBand height={8} /></div>
    </div>
  );
}
