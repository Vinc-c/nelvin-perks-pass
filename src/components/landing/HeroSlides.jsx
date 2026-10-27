import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";

/**
 * Hero background. One image = still Ken-Burns; several images (CMS: section HERO,
 * key hero_background) = cross-fading slideshow. Pauses when the tab is hidden and
 * stays still for visitors who prefer reduced motion.
 */
export default function HeroSlides({ images, interval = 6500 }) {
  const list = images && images.length ? images : [];
  const [index, setIndex] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { setIndex(0); }, [list.length]);

  useEffect(() => {
    if (list.length < 2 || reduced) return undefined;
    // Warm the next slide so the fade never shows a blank frame.
    const next = new window.Image();
    next.src = list[(index + 1) % list.length];
    const id = setTimeout(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % list.length);
    }, interval);
    return () => clearTimeout(id);
  }, [index, list, interval, reduced]);

  if (!list.length) return null;
  return (
    <>
      {list.map((src, i) => (
        <div key={src} className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
          {/* key on the active slide restarts the Ken-Burns zoom at every turn */}
          <Image key={i === index ? `on-${index}` : `off-${i}`} src={src} fittingType="fill" loading={i === 0 ? "eager" : "lazy"} className={`h-full w-full ${i === index && !reduced ? "animate-kenburns" : ""}`} />
        </div>
      ))}
      {list.length > 1 && (
        <div className="absolute bottom-3 start-1/2 z-10 flex -translate-x-1/2 gap-1.5 rtl:translate-x-1/2" role="tablist" aria-label="Hero images">
          {list.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-nv-gold" : "w-1.5 bg-white/70"}`} />
          ))}
        </div>
      )}
    </>
  );
}
