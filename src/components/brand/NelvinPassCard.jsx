import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { NelvinMark } from "@/components/NelvinLogo";
import KenteBand from "@/components/brand/KenteBand";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";

const TIERS = {
  PASS_FREE: { label: "Member", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_BASIC: { label: "Pass Basic", glyph: "PASS_FREE", bg: "from-nv-emerald via-nv-emerald to-nv-deep", ring: "ring-white/10" },
  PASS_PREMIUM: { label: "Pass Premium", glyph: "PASS_PREMIUM", bg: "from-nv-deep via-nv-emerald to-nv-deep", ring: "ring-nv-gold/60" },
  PASS_VIP: { label: "VIP Gold", glyph: "PASS_VIP", bg: "from-[#0B1612] via-[#14201B] to-nv-deep", ring: "ring-nv-gold" },
};

/** Member-selectable card colours (the tier's own look is the default). */
export const CARD_COLORS = {
  emerald: { bg: "from-nv-emerald via-nv-emerald to-nv-deep", swatch: "#1F6B50" },
  midnight: { bg: "from-[#0B1B3A] via-[#12285A] to-[#0A1530]", swatch: "#12285A" },
  gold: { bg: "from-[#B8893A] via-[#9A6F25] to-[#6E4D14]", swatch: "#B8893A" },
  royal: { bg: "from-[#4B2A8A] via-[#38207A] to-[#241450]", swatch: "#4B2A8A" },
  burgundy: { bg: "from-[#8A1F3A] via-[#6E1830] to-[#47101F]", swatch: "#8A1F3A" },
  graphite: { bg: "from-[#2B2F36] via-[#1B1E24] to-[#0E1013]", swatch: "#2B2F36" },
};

/**
 * Digital membership card. `illustration` shows a placeholder holder so the
 * marketing version never looks like a real person's card.
 */
export default function NelvinPassCard({ tier = "PASS_PREMIUM", name, code, qrValue, showQr = true, illustration = false, color = null, variant = "default", className = "" }) {
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
  const shown = code || (illustration ? "NLV · 0000 0000" : "");
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${bg} p-5 text-white shadow-2xl shadow-nv-deep/40 ring-1 ${t.ring} ${className}`}
      role="img"
      aria-label={tr("pass.aria", { tier: `${t.label}${illustration ? ` (${tr("pass.illustration")})` : ""}` })}
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{tr("pass.holder")}</p>
          <p className="truncate text-lg font-bold tracking-wide">{holder}</p>
          {shown && <p className="mt-1 font-mono text-xs tracking-widest text-nv-gold-light">{shown}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
            <NvIcon name="VERIFIED" tone="dark" className="h-4 w-4 text-nv-gold-light" /> {tr("pass.valid")}
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
