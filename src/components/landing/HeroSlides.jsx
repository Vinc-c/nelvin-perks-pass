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
  // Items are `{ type: "image" | "video", url, poster }` (plain URL strings still work).
  const list = (images || []).map((i) => (typeof i === "string" ? { type: "image", url: i, poster: "" } : i)).filter((i) => i?.url);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(0);
  const [videoMs, setVideoMs] = useState(null); // real duration of the playing video
  const [blocked, setBlocked] = useState(false); // autoplay refused by the browser
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const saveData = typeof navigator !== "undefined" && !!navigator.connection?.saveData;
  const cur = list[index] || list[0];
  const playVideo = cur?.type === "video" && !reduced && !saveData && !blocked;
  const slideMs = playVideo ? Math.min((videoMs || 12000) + 800, 30000) : interval;

  useEffect(() => { setIndex(0); }, [list.length]);
  useEffect(() => { setVideoMs(null); }, [index]);

  const go = (i) => { setTurn((n) => n + 1); setIndex(i); };

  useEffect(() => {
    if (list.length < 2 || reduced) return undefined;
    // Warm the next slide so the transition never shows a blank frame.
    const nx = list[(index + 1) % list.length];
    const next = new window.Image();
    next.src = nx.type === "video" ? nx.poster || "" : nx.url;
    // A video moves on when it ends (see onEnded); this timer is the safety net.
    const id = setTimeout(() => {
      if (!document.hidden) go((index + 1) % list.length);
    }, slideMs);
    return () => clearTimeout(id);
  }, [index, list.length, slideMs, reduced]);

  if (!list.length) return null;
  const still = cur.type === "video" ? cur.poster || "" : cur.url;
  const tr = reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 1 } } : TRANSITIONS[turn % TRANSITIONS.length];
  return (
    <>
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div key={`${index}-${cur.url}`} className="absolute inset-0 will-change-transform" style={{ zIndex: turn + 1 }}
            initial={tr.initial} animate={tr.animate} exit={tr.exit} transition={{ duration: reduced ? 0.6 : 1.5, ease: E }}>
            {playVideo ? (
              <video src={cur.url} poster={cur.poster || undefined} className="h-full w-full object-cover" autoPlay muted playsInline preload="auto"
                loop={list.length < 2} disablePictureInPicture
                onLoadedMetadata={(e) => setVideoMs((e.currentTarget.duration || 0) * 1000 || null)}
                onEnded={() => list.length > 1 && go((index + 1) % list.length)}
                onError={() => setBlocked(true)}
                ref={(el) => { if (el) el.play?.().catch(() => setBlocked(true)); }} />
            ) : (
              <Image src={still} fittingType="fill" loading={index === 0 ? "eager" : "lazy"} className={`h-full w-full ${reduced || cur.type === "video" ? "" : "animate-kenburns"}`} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-3 start-1/2 z-10 flex -translate-x-1/2 gap-1.5 rtl:translate-x-1/2" role="tablist" aria-label="Hero images">
          {list.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} className="relative h-1.5 overflow-hidden rounded-full bg-white/70 transition-all" style={{ width: i === index ? 28 : 6 }}>
              {i === index && !reduced && (
                <motion.span key={turn} className="absolute inset-0 origin-left bg-nv-gold" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: slideMs / 1000, ease: "linear" }} />
              )}
              {i === index && reduced && <span className="absolute inset-0 bg-nv-gold" />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
