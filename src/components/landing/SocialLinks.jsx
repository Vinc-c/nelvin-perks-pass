import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Youtube, MessageCircle, Send, Music2 } from "lucide-react";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const NETWORKS = [
  { id: "facebook", label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/nelvin" },
  { id: "instagram", label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/nelvin" },
  { id: "x", label: "X", Icon: XIcon, placeholder: "https://x.com/nelvin" },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin, placeholder: "https://linkedin.com/company/nelvin" },
  { id: "youtube", label: "YouTube", Icon: Youtube, placeholder: "https://youtube.com/@nelvin" },
  { id: "tiktok", label: "TikTok", Icon: Music2, placeholder: "https://tiktok.com/@nelvin" },
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle, placeholder: "https://wa.me/237600000000" },
  { id: "telegram", label: "Telegram", Icon: Send, placeholder: "https://t.me/nelvin" },
];

/** Footer icons. Only networks with a link saved in Admin → Social & login are shown. */
export default function SocialLinks() {
  const links = usePlatformSetting("social_links", {}) || {};
  const reduced = useReducedMotion();
  const active = NETWORKS.filter((n) => typeof links[n.id] === "string" && /^https:\/\//.test(links[n.id]));
  if (!active.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2.5">
      {active.map(({ id, label, Icon }) => (
        <li key={id}>
          <motion.a href={links[id]} target="_blank" rel="noopener noreferrer me" aria-label={label} title={label}
            whileHover={reduced ? undefined : { y: -3, scale: 1.06 }} whileTap={reduced ? undefined : { scale: 0.95 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="nv-focus flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-nv-gold-light hover:text-nv-gold-light">
            <Icon className="h-[18px] w-[18px]" />
          </motion.a>
        </li>
      ))}
    </ul>
  );
}
