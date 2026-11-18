import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import NelvinPassCard from "@/components/brand/NelvinPassCard";
import NvIcon from "@/components/brand/NvIcon";
import { useI18n } from "@/i18n/I18nContext";
import { usePlans } from "@/hooks/usePlans";
import { Stagger, StaggerItem, WordReveal } from "@/components/landing/motion";

const GLYPH = { PASS_BASIC: "PASS_FREE", PASS_PREMIUM: "PASS_PREMIUM", PASS_VIP: "PASS_VIP" };
const PERK = { PASS_BASIC: "land.pass.basic", PASS_PREMIUM: "land.pass.premium", PASS_VIP: "land.pass.vip" };

/** One card of the fan: scroll opens the fan, the front card also tilts and glares with the pointer. */
function FanCard({ tier, progress, from, to, z, float = 0, interactive = false }) {
  const reduced = useReducedMotion();
  const y = useTransform(progress, [0, 1], [from.y, to.y]);
  const x = useTransform(progress, [0, 1], [from.x, to.x]);
  const rotate = useTransform(progress, [0, 1], [from.r, to.r]);
  const scale = useTransform(progress, [0, 1], [from.s, to.s]);
  const onMove = (e) => {
    if (!interactive || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--mx", `${px * 100}%`);
    e.currentTarget.style.setProperty("--my", `${py * 100}%`);
    e.currentTarget.firstChild.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 16}deg) rotateX(${(0.5 - py) * 12}deg)`;
  };
  const onLeave = (e) => { if (e.currentTarget.firstChild) e.currentTarget.firstChild.style.transform = ""; };
  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ y, x, rotate, scale, zIndex: z }}>
      <motion.div
        animate={reduced || !float ? undefined : { y: [0, -float, 0] }}
        transition={{ duration: 5 + z, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={interactive ? "group cursor-pointer" : ""} onPointerMove={onMove} onPointerLeave={onLeave}>
          <div className="transition-transform duration-200 ease-out will-change-transform">
            <NelvinPassCard tier={tier} illustration shine={interactive} className="shadow-[0_30px_60px_-20px_rgba(26,32,96,0.55)]" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Landing: the digital card and what each Pass unlocks (names and prices come from the live plans). */
export default function PassShowcase() {
  const { t } = useI18n();
  const { plans } = usePlans("B2C");
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 55%"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const still = useMotionValue(1);
  const open = reduced ? still : p;
  return (
    <section ref={ref} className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative isolate mx-auto w-full max-w-md">
          <motion.div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,_#E82B2C33_0%,_#1A206022_45%,_transparent_72%)]"
            animate={reduced ? undefined : { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
          <div className="relative aspect-[1/0.95]">
            <FanCard tier="PASS_BASIC" progress={open} z={1} from={{ x: "0%", y: "0%", r: 0, s: 0.92 }} to={{ x: "-6%", y: "0%", r: -7, s: 0.94 }} float={6} />
            <FanCard tier="PASS_PREMIUM" progress={open} z={2} from={{ x: "0%", y: "0%", r: 0, s: 0.96 }} to={{ x: "6%", y: "20%", r: 4, s: 0.97 }} float={8} />
            <FanCard tier="PASS_VIP" progress={open} z={3} from={{ x: "0%", y: "0%", r: 0, s: 1 }} to={{ x: "0%", y: "42%", r: -2, s: 1 }} float={5} interactive />
          </div>
        </div>

        <div>
          <motion.p className="text-sm font-semibold text-nv-bronze" initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>{t("land.pass.kicker")}</motion.p>
          <WordReveal text={t("land.pass.title")} className="mt-2 text-3xl font-bold leading-tight text-nv-ink sm:text-4xl" />
          <motion.p className="mt-3 max-w-xl text-nv-muted" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            {t("land.pass.text")}
          </motion.p>
          <Stagger as="ul" className="mt-6 space-y-3">
            {plans.map((pl) => (
              <StaggerItem as="li" key={pl.code}>
                <motion.div whileHover={reduced ? undefined : { x: 6, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="group relative flex items-start gap-4 overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-nv-line transition-shadow hover:shadow-lg hover:shadow-nv-deep/10">
                  <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1 origin-top scale-y-0 rounded-full bg-gradient-to-b from-nv-emerald to-nv-gold transition-transform duration-300 group-hover:scale-y-100" />
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-nv-ivory-2 text-nv-emerald ring-1 ring-nv-line transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <NvIcon name={GLYPH[pl.code] || "PASS_FREE"} className="h-7 w-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-nv-ink">{pl.name}</span>
                      <span className="text-sm font-semibold text-nv-bronze">${pl.price_monthly}<span className="font-normal text-nv-muted">{t("land.pass.perMonth")}</span></span>
                    </span>
                    <span className="mt-0.5 block text-sm text-nv-muted">{PERK[pl.code] ? t(PERK[pl.code]) : pl.tagline}</span>
                  </span>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
          <motion.div className="mt-6 inline-block" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <Link to="/pricing" className="inline-flex items-center rounded-full bg-nv-deep px-7 py-3 font-semibold text-white transition hover:bg-nv-emerald">
              {t("land.pass.compare")}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
