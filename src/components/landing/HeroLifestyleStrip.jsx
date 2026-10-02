import React from "react";
import { Image } from "@/components/ui/image";

const LIFESTYLE = [
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/6a31eb0f6_generated_image.png", label: "Dining" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/04c5cd67b_generated_image.png", label: "Hotels" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/603a4b51a_generated_image.png", label: "Wellness" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/cba30820d_generated_image.png", label: "Fitness" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/2039384ca_generated_image.png", label: "Travel" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/542a93280_generated_image.png", label: "Beauty" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/6a5e76d92_generated_image.png", label: "Shopping" },
  { src: "https://media.base44.com/images/public/6abfd80d39eaeaf0ec0f1f2f/0bebc64e4_generated_image.png", label: "Home" },
];

export default function HeroLifestyleStrip() {
  const loop = [...LIFESTYLE, ...LIFESTYLE];
  return (
    <div className="relative overflow-hidden">
      <div className="flex w-max gap-4 animate-marquee">
        {loop.map((it, i) => (
          <div key={i} className="not-pill relative h-36 w-52 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200 sm:h-44 sm:w-64">
            <Image src={it.src} fittingType="fill" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
            <span className="absolute bottom-2.5 left-3 text-sm font-bold text-white drop-shadow">{it.label}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}