import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";

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
