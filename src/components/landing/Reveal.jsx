import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Fades and lifts its children into view as they enter the viewport. No motion for reduced-motion users. */
export default function Reveal({ children, delay = 0, y = 32, className = "" }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
