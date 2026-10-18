import React from "react";
import { Image } from "@/components/ui/image";
import NelvinLogo from "@/components/NelvinLogo";
import { CATEGORY_IMAGES } from "@/data/categoryImages";

/** Phone drawn in code that illustrates the Nelvin home screen (no fake prices or ratings). */
export default function PhoneMock({ className = "" }) {
  return (
    <div className={`relative aspect-[9/19] w-full rounded-[2.6rem] bg-[#1b1d22] p-[10px] shadow-2xl ring-1 ring-black/40 ${className}`} role="img" aria-label="Aperçu de l'application Nelvin">
      <div className="absolute left-1/2 top-[18px] z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="flex h-full flex-col overflow-hidden rounded-[2.1rem] bg-[#FAF6EC]">
        <div className="flex items-center justify-between px-4 pb-2 pt-10">
          <NelvinLogo className="h-6" />
          <span className="rounded-full bg-[#C8A24A] px-2 py-0.5 text-[9px] font-bold text-[#08261D]">Member offer</span>
        </div>
        <div className="px-3">
          <div className="relative h-32 overflow-hidden rounded-2xl">
            <Image src={CATEGORY_IMAGES.FOOD_DINING} fittingType="fill" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-2 left-3 text-sm font-bold text-white">Restaurants</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[["HOTELS_HOSPITALITY", "Hôtels"], ["WELLNESS_MENTAL", "Bien-être"], ["FITNESS_SPORTS", "Sport"], ["BEAUTY_CARE", "Beauté"]].map(([k, l]) => (
              <div key={k} className="relative h-20 overflow-hidden rounded-xl">
                <Image src={CATEGORY_IMAGES[k]} fittingType="fill" className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <p className="absolute bottom-1.5 left-2 text-[11px] font-bold text-white">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-white p-2.5 ring-1 ring-nv-line">
            <p className="text-[11px] font-bold text-nv-ink">Autour de moi</p>
            <div className="mt-1.5 h-12 rounded-lg bg-[repeating-linear-gradient(115deg,#e7edf3_0_10px,#eef3f7_10px_20px)]" />
          </div>
        </div>
        <div className="mt-auto flex justify-around border-t border-nv-line bg-white py-2.5 text-[9px] font-semibold text-nv-muted">
          <span className="text-[#08261D]">Offres</span><span>Carte</span><span>Wallet</span><span>Profil</span>
        </div>
      </div>
    </div>
  );
}
