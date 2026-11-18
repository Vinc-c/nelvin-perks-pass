import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { NelvinMark } from "@/components/NelvinLogo";
import KenteBand from "@/components/brand/KenteBand";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

const TIERS = {
  PASS_FREE: { label: "Member", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_BASIC: { label: "Pass Basic", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_PREMIUM: { label: "Pass Premium", glyph: "PASS_PREMIUM", bg: "from-nv-deep via-nv-emerald to-nv-deep", ring: "ring-nv-gold/60" },
  PASS_VIP: { label: "VIP Gold", glyph: "PASS_VIP", bg: "from-[#12163F] via-[#1A1B2E] to-nv-deep", ring: "ring-nv-gold" },
};

/** Member-selectable card colours (the tier's own look is the default). */
export const CARD_COLORS = {
  emerald: { bg: "from-nv-emerald via-nv-emerald to-nv-deep", swatch: "#F0575A" },
  midnight: { bg: "from-[#0B1B3A] via-[#12285A] to-[#0A1530]", swatch: "#12285A" },
  gold: { bg: "from-[#FF5A5C] via-[#9A6F25] to-[#6E4D14]", swatch: "#FF5A5C" },
  royal: { bg: "from-[#4B2A8A] via-[#38207A] to-[#241450]", swatch: "#4B2A8A" },
  burgundy: { bg: "from-[#8A1F3A] via-[#6E1830] to-[#47101F]", swatch: "#8A1F3A" },
  graphite: { bg: "from-[#2B2F36] via-[#1B1E24] to-[#0E1013]", swatch: "#2B2F36" },
};

/**
 * Digital membership card. `illustration` shows a placeholder holder so the
 * marketing version never looks like a real person's card.
 */
export default function NelvinPassCard({ tier = "PASS_PREMIUM", name, code, qrValue, showQr = true, illustration = false, shine = false, color = null, variant = "default", className = "" }) {
  const { t: tr } = useI18n();
  const t = TIERS[tier] || TIERS.PASS_FREE;
  if (variant === "member") {
    const mbg = CARD_COLORS[color || "burgundy"]?.bg || CARD_COLORS.burgundy.bg;
    return (
      <div className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[20px] bg-gradient-to-br ${mbg} p-5 text-white ${className}`} role="img" aria-label={tr("pass.aria", { tier: t.label })}>
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.06]" />
        <span className="pointer-events-none absolute -right-2 top-6 h-24 w-24 rounded-full bg-white/[0.06]" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2"><NelvinMark className="h-8 w-8" /><span className="text-sm font-medium">Nelvin</span></div>
          <span className="rounded-full border border-nv-gold px-2.5 py-0.5 text-[11px] text-nv-gold-light">{t.label}</span>
        </div>
        {code && <p className="relative mt-6 font-mono text-base tracking-[0.25em] text-white/90">{code}</p>}
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/60">{tr("rd.cardholder")}</p>
            <p className="truncate text-lg font-medium">{name || tr("pass.member")}</p>
          </div>
          <span className="shrink-0 rounded-full border border-nv-gold/60 px-2 py-0.5 text-[10px] text-nv-gold-light">{tr("rd.verified")}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-nv-gold" />
      </div>
    );
  }
  const bg = (color && CARD_COLORS[color]?.bg) || t.bg;
  const holder = name || tr(illustration ? "pass.yourName" : "pass.member");
  const shown = code || (illustration ? "NLV 0000 0000 0000" : "");
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[18px] bg-gradient-to-br ${bg} p-4 text-white shadow-2xl shadow-nv-deep/40 ring-1 ring-inset ${t.ring} sm:p-5 ${className}`}
      role="img"
      aria-label={tr("pass.aria", { tier: `${t.label}${illustration ? ` (${tr("pass.illustration")})` : ""}` })}
    >
      <NvIcon name="AFRICA" tone="dark" className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-nv-gold" faint={0.12} strokeWidth={0.5} />
      {/* fine diagonal guilloche texture, like printed security patterns */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(135deg,#fff_0_1px,transparent_1px_7px)]" />
      {/* top edge highlight */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <NelvinMark className="h-8 w-8 sm:h-9 sm:w-9" />
          <span className="text-sm font-bold tracking-wide">Nelvin</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-2 pr-3 text-[11px] font-semibold text-nv-gold-light ring-1 ring-white/15">
          <NvIcon name={t.glyph} tone="dark" className="h-4 w-4 text-nv-gold-light" /> {t.label}
        </span>
      </div>
      {/* EMV chip + contactless */}
      <div className="relative mt-3 flex items-center gap-3 sm:mt-4">
        <span aria-hidden="true" className="relative block h-[26px] w-9 overflow-hidden rounded-[6px] bg-gradient-to-br from-[#F6E3A3] via-[#D9B25A] to-[#B58A2E] ring-1 ring-black/25 sm:h-[30px] sm:w-[42px]">
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
          <span className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-black/25" />
          <span className="absolute inset-[5px] rounded-[3px] border border-black/20" />
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M8 6c2.5 3.5 2.5 8.5 0 12" /><path d="M12 4c3.7 4.8 3.7 11.2 0 16" /><path d="M16 2c4.8 6 4.8 14 0 20" />
        </svg>
      </div>
      {shown && <p className="relative mt-2 font-mono text-[13px] font-medium tracking-[0.18em] text-white/95 [text-shadow:0_1px_0_rgba(0,0,0,0.45),0_-1px_0_rgba(255,255,255,0.15)] sm:mt-3 sm:text-base">{shown}</p>}
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">{tr("pass.holder")}</p>
          <p className="truncate text-sm font-bold uppercase tracking-wider sm:text-base">{holder}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/70">
            <NvIcon name="VERIFIED" tone="dark" className="h-3.5 w-3.5 text-nv-gold-light" /> {tr("pass.valid")}
          </p>
        </div>
        {showQr && (
          <div className="shrink-0 rounded-lg bg-white p-1">
            <QRCodeSVG value={qrValue || "https://nelvin.app"} size={52} level="M" fgColor="#1A2060" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 opacity-90"><KenteBand height={6} /></div>
      {/* holographic sheen (static) */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.10)_45%,transparent_60%)]" />
      {/* pointer glare: follows --mx/--my set by a parent with class "group" */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(circle_at_var(--mx,50%)_var(--my,0%),rgba(255,255,255,0.34),transparent_55%)] group-hover:opacity-100" />
      {shine && <CardShine />}
    </div>
  );
}

function CardShine() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent"
      animate={{ x: ["0%", "520%"] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }} />
  );
}
