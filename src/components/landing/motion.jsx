import React, { useEffect, useRef, useState } from "react";
import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion";

/** Thin brand-coloured reading-progress bar pinned under the header. */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  if (reduced) return null;
  return <motion.div aria-hidden="true" style={{ scaleX }} className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-nv-emerald to-nv-gold" />;
}

/** Number that counts up the first time it scrolls into view. */
export function Counter({ value, suffix = "", className = "" }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(reduced ? value : 0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduced) { setN(value); return undefined; }
    const c = animate(0, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, reduced]);
  return <span ref={ref} className={className}>{n.toLocaleString()}{suffix}</span>;
}

/** Heading whose words rise into place one after the other. The heading itself is observed (the words start clipped, so they can never report "in view"). */
export function WordReveal({ text, as: Tag = "h2", className = "" }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const words = String(text || "").split(" ");
  if (reduced) return <Tag className={className}>{text}</Tag>;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span aria-hidden="true" className="inline-block overflow-hidden pb-1 align-bottom">
            <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: inView ? 0 : "110%" }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}>{w}</motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

/** Children fade+lift in sequence when the group enters the viewport. */
export function Stagger({ as = "div", className = "", children }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return <Comp className={className} variants={reduced ? undefined : container} initial={reduced ? false : "hidden"} whileInView="show" viewport={{ once: true, margin: "-8% 0px" }}>{children}</Comp>;
}
export function StaggerItem({ as = "div", className = "", children }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  return <Comp className={className} variants={reduced ? undefined : item}>{children}</Comp>;
}

const GLYPHS = [".", ":", "·", ",", ";", "_"];
/** Short label whose letters resolve out of punctuation glyphs when it scrolls into view (house "decode" effect). Keep it to one line. */
export function ScrambleText({ text, className = "", duration = 1.1 }) {
  const str = String(text ?? "");
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [out, setOut] = useState(str);
  const seeds = useRef([]);
  useEffect(() => {
    if (reduced || !inView || !str) { setOut(str); return undefined; }
    seeds.current = Array.from(str, () => Math.random());
    const n = Math.max(str.length, 1);
    const c = animate(0, 1, {
      duration, ease: [0.22, 1, 0.36, 1],
      onUpdate: (p) => setOut(Array.from(str, (ch, i) => (ch === " " || p > 0.7 * (i / n) + 0.3 * seeds.current[i] ? ch : GLYPHS[Math.floor((p * 40 + i * 7) % GLYPHS.length)])).join("")),
      onComplete: () => setOut(str),
    });
    return () => { c.stop(); setOut(str); };
  }, [str, inView, reduced, duration]);
  // The final text keeps the box size (no layout shift); the decoding layer sits on top of it.
  return (
    <span ref={ref} className={`inline-grid ${className}`}>
      <span style={{ gridArea: "1 / 1", visibility: out === str ? "visible" : "hidden" }}>{str}</span>
      {out !== str && <span aria-hidden="true" style={{ gridArea: "1 / 1" }}>{out}</span>}
    </span>
  );
}

/** Round label that follows the pointer over its children (mouse only), e.g. "View" over a card image. */
export function CursorBubble({ label, className = "", children }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.4 }); const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.4 });
  const [on, setOn] = useState(false);
  const fine = typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  if (reduced || !fine) return <div className={className}>{children}</div>;
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); x.set(e.clientX - r.left); y.set(e.clientY - r.top); };
  return (
    <div className={`relative ${className}`} onPointerMove={move} onPointerEnter={(e) => { move(e); setOn(true); }} onPointerLeave={() => setOn(false)}>
      {children}
      <AnimatePresence>
        {on && (
          <motion.span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-sm font-semibold italic text-nv-ink shadow-lg"
            style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>{label}</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
