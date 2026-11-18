import React, { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** Headline: each word slides up from a mask, accent segments keep their colour. segments = [{ text, accent }] */
export function HeroHeadline({ segments, className = "" }) {
  const reduced = useReducedMotion();
  let n = 0;
  return (
    <h1 className={className}>
      {segments.map((seg, si) =>
        String(seg.text).split(/(\s+)/).map((w, wi) => {
          if (!w) return null;
          if (/^\s+$/.test(w)) return " ";
          const i = n++;
          const word = <span className={seg.accent ? "bg-gradient-to-r from-nv-bronze to-nv-gold bg-clip-text text-transparent" : undefined}>{w}</span>;
          if (reduced) return <span key={`${si}-${wi}`}>{word}</span>;
          return (
            <span key={`${si}-${wi}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span className="inline-block" initial={{ y: "115%", rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.75, delay: 0.15 + i * 0.07, ease: EASE }}>{word}</motion.span>
            </span>
          );
        })
      )}
    </h1>
  );
}

/** Soft drifting colour orbs behind the hero (decorative, GPU-only transforms). */
export function HeroOrbs() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  const orb = (cls, x, y, d) => (
    <motion.span aria-hidden="true" className={`pointer-events-none absolute rounded-full blur-3xl ${cls}`}
      animate={{ x, y, scale: [1, 1.12, 1] }} transition={{ duration: d, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />
  );
  return (
    <>
      {orb("-left-24 top-10 h-72 w-72 bg-nv-gold/30", [0, 60, 0], [0, 40, 0], 11)}
      {orb("right-0 top-1/3 h-80 w-80 bg-nv-emerald/20", [0, -70, 0], [0, 50, 0], 14)}
      {orb("bottom-0 left-1/3 h-64 w-64 bg-nv-bronze/20", [0, 50, 0], [0, -40, 0], 12)}
    </>
  );
}

/** Button/link wrapper that leans toward the pointer and shows a light sweep. */
export function Magnetic({ children, className = "" }) {
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.2);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div className={`relative overflow-hidden rounded-full ${className}`} style={reduced ? undefined : { x, y }} onPointerMove={reduced ? undefined : onMove} onPointerLeave={reset} whileTap={{ scale: 0.97 }}>
      {children}
      {!reduced && (
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/35"
          animate={{ x: ["0%", "480%"] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3.2, ease: "easeInOut" }} />
      )}
    </motion.div>
  );
}

/** 3D tilt that follows the pointer (desktop); flat on touch / reduced motion. */
export function Tilt({ children, className = "" }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { px.set(0); py.set(0); };
  return (
    <div ref={ref} className={className} style={{ perspective: 1000 }} onPointerMove={reduced ? undefined : onMove} onPointerLeave={reset}>
      <motion.div style={reduced ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>{children}</motion.div>
    </div>
  );
}

/** Small "scroll" cue: a dot sliding down inside a pill. */
export function ScrollCue({ label }) {
  const reduced = useReducedMotion();
  return (
    <a href="#contenu-suite" className="mx-auto mt-2 hidden flex-col items-center gap-1 text-xs text-nv-muted lg:flex" aria-label={label}>
      <span className="flex h-9 w-5 justify-center rounded-full border border-nv-muted/50 pt-1.5">
        <motion.span className="h-1.5 w-1 rounded-full bg-nv-bronze" animate={reduced ? undefined : { y: [0, 14, 0], opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
      </span>
      {label}
    </a>
  );
}
