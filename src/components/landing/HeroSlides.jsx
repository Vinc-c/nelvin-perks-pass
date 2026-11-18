import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image } from "@/components/ui/image";

/**
 * Hero background. One image = still Ken-Burns; several images (CMS: section HERO,
 * key hero_background) = slideshow with a different cinematic transition at every turn
 * (reveal wipes in four directions, zoom-through, blur dissolve) plus a slow Ken-Burns drift.
 * Pauses when the tab is hidden; reduced-motion visitors get a plain cross-fade.
 */
const E = [0.76, 0, 0.24, 1];
const TRANSITIONS = [
  // wipe from the right
  { initial: { clipPath: "inset(0 0 0 100%)", scale: 1.15 }, animate: { clipPath: "inset(0 0 0 0%)", scale: 1 }, exit: { opacity: 1 } },
  // wipe from below
  { initial: { clipPath: "inset(100% 0 0 0)", scale: 1.15 }, animate: { clipPath: "inset(0% 0 0 0)", scale: 1 }, exit: { opacity: 1 } },
  // zoom-through dissolve
  { initial: { opacity: 0, scale: 1.35, filter: "blur(14px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, exit: { opacity: 1 } },
  // wipe from the left
  { initial: { clipPath: "inset(0 100% 0 0)", scale: 1.15 }, animate: { clipPath: "inset(0 0% 0 0)", scale: 1 }, exit: { opacity: 1 } },
  // circular iris
  { initial: { clipPath: "circle(0% at 50% 60%)", scale: 1.2 }, animate: { clipPath: "circle(150% at 50% 60%)", scale: 1 }, exit: { opacity: 1 } },
];

export default function HeroSlides({ images, interval = 6500 }) {
  const list = images && images.length ? images : [];
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => { setIndex(0); }, [list.length]);

  const go = (i) => { setTurn((n) => n + 1); setIndex(i); };

  useEffect(() => {
    if (list.length < 2 || reduced) return undefined;
    // Warm the next slide so the transition never shows a blank frame.
    const next = new window.Image();
    next.src = list[(index + 1) % list.length];
    const id = setTimeout(() => {
      if (!document.hidden) go((index + 1) % list.length);
    }, interval);
    return () => clearTimeout(id);
  }, [index, list, interval, reduced]);

  if (!list.length) return null;
  const tr = reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 1 } } : TRANSITIONS[turn % TRANSITIONS.length];
  return (
    <>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div key={`${index}-${list[index]}`} className="absolute inset-0 will-change-transform" style={{ zIndex: turn + 1 }}
            initial={tr.initial} animate={tr.animate} exit={tr.exit} transition={{ duration: reduced ? 0.6 : 1.5, ease: E }}>
            <Image src={list[index]} fittingType="fill" loading={index === 0 ? "eager" : "lazy"} className={`h-full w-full ${reduced ? "" : "animate-kenburns"}`} />
          </motion.div>
        </AnimatePresence>
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-3 start-1/2 z-10 flex -translate-x-1/2 gap-1.5 rtl:translate-x-1/2" role="tablist" aria-label="Hero images">
          {list.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} className="relative h-1.5 overflow-hidden rounded-full bg-white/70 transition-all" style={{ width: i === index ? 28 : 6 }}>
              {i === index && !reduced && (
                <motion.span key={turn} className="absolute inset-0 origin-left bg-nv-gold" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: interval / 1000, ease: "linear" }} />
              )}
              {i === index && reduced && <span className="absolute inset-0 bg-nv-gold" />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
