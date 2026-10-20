import React from "react";
import { Image } from "@/components/ui/image";
import NelvinLogo from "@/components/NelvinLogo";
import NvIcon, { CategoryIcon } from "@/components/brand/NvIcon";
import { CATEGORY_IMAGES } from "@/data/categoryImages";

const TABS = [["PERCENT", "Offres", true], ["CITY_PIN", "Carte"], ["WALLET", "Wallet"], ["PASS_FREE", "Pass"]];

/** Small street map drawn in code (no fake partner names, no fake prices). */
function MiniMap() {
  return (
    <svg viewBox="0 0 160 70" className="h-full w-full" aria-hidden="true" focusable="false">
      <rect width="160" height="70" fill="#EEE7D3" />
      <path d="M-5 52C30 40 50 56 82 42S130 30 168 38" stroke="#C9DCD3" strokeWidth="9" fill="none" />
      <g stroke="#fff" strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M0 22H160" /><path d="M0 60H160" /><path d="M38 0V70" /><path d="M96 0V70" /><path d="M128 0L112 70" />
      </g>
      <g fill="#E0D6BB"><rect x="44" y="27" width="20" height="14" rx="2" /><rect x="102" y="27" width="16" height="22" rx="2" /><rect x="6" y="28" width="26" height="12" rx="2" /></g>
      {[[52, 20], [108, 24], [76, 52]].map(([x, y]) => (
        <g key={x} transform={`translate(${x - 6} ${y - 14})`}>
          <path d="M6 14s-5.5-4.7-5.5-9.2a5.5 5.5 0 0 1 11 0C11.5 9.3 6 14 6 14z" fill="#08261D" />
          <circle cx="6" cy="4.8" r="2" fill="#C8A24A" />
        </g>
      ))}
    </svg>
  );
}

/** Phone drawn in code that illustrates the Nelvin home screen. */
export default function PhoneMock({ className = "" }) {
  return (
    <div className={`relative aspect-[9/19] w-full rounded-[2.6rem] bg-[#1b1d22] p-[10px] shadow-2xl ring-1 ring-black/40 ${className}`} role="img" aria-label="Aperçu de l'application Nelvin">
      <div className="absolute left-1/2 top-[18px] z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="flex h-full flex-col overflow-hidden rounded-[2.1rem] bg-[#FAF6EC]">
        <div className="flex items-center justify-between px-4 pb-2 pt-10">
          <NelvinLogo className="h-6" />
          <span className="flex items-center gap-1 rounded-full bg-[#08261D] px-2 py-0.5 text-[9px] font-bold text-[#E6CF8B]">
            <NvIcon name="CITY_PIN" tone="dark" className="h-3 w-3" /> Ma ville
          </span>
        </div>
        <div className="px-3">
          <div className="relative h-28 overflow-hidden rounded-2xl">
            <Image src={CATEGORY_IMAGES.FOOD_DINING} fittingType="fill" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute left-2 top-2 rounded-full bg-[#C8A24A] px-2 py-0.5 text-[9px] font-bold text-[#08261D]">Member offer</span>
            <p className="absolute bottom-2 left-3 flex items-center gap-1 text-sm font-bold text-white">
              <CategoryIcon category="FOOD_DINING" tone="dark" className="h-4 w-4 text-white" /> Restaurants
            </p>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["HOTELS_HOSPITALITY", "WELLNESS_MENTAL", "FITNESS_SPORTS", "BEAUTY_CARE"].map((k) => (
              <div key={k} className="flex aspect-square items-center justify-center rounded-xl bg-white text-[#0F4A38] ring-1 ring-[#E4DAC3]">
                <CategoryIcon category={k} className="h-6 w-6" />
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-xl bg-white p-2 ring-1 ring-[#E4DAC3]">
            <p className="mb-1.5 text-[11px] font-bold text-[#14201B]">Autour de moi</p>
            <div className="h-[72px] overflow-hidden rounded-lg"><MiniMap /></div>
          </div>
        </div>
        <div className="mt-auto flex justify-around border-t border-[#E4DAC3] bg-white py-2 text-[9px] font-semibold text-[#55625B]">
          {TABS.map(([g, l, on]) => (
            <span key={l} className={`flex flex-col items-center gap-0.5 ${on ? "text-[#08261D]" : ""}`}>
              <NvIcon name={g} className="h-[18px] w-[18px]" />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
