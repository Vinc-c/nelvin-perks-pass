import { useEffect, useState } from "react";
import { entities } from "@/api/entities";

let cache = null;
let promise = null;

// Public CMS content (partner logos, hero/marketing images, copy). These
// tables are readable anonymously (active rows only) under RLS.
export function loadPublicContent(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!promise || force) {
    promise = Promise.all([
      entities.PartnerLogo.filter({ active: true }, "sort_order", 500),
      entities.SiteImage.filter({ active: true }, "-created_date", 500),
      entities.SiteCopy.list("-created_date", 500),
    ])
      .then(([logos, images, copy]) => {
        cache = { logos, images, copy };
        promise = null;
        return cache;
      })
      .catch(() => {
        promise = null;
        return { logos: [], images: [], copy: [] };
      });
  }
  return promise;
}

export function usePublicContent() {
  const [data, setData] = useState(cache);
  useEffect(() => {
    loadPublicContent().then(setData);
  }, []);
  return data;
}

/** "Hero Background" / "hero background" / "hero-background" -> "hero_background". */
export const normKey = (k) => String(k || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function imageByKey(images, key, fallback) {
  const want = normKey(key);
  const img = (images || []).find((i) => normKey(i.key) === want && i.active !== false && i.image_url);
  return img?.image_url || fallback;
}

/** Every active hero image, oldest first: the hero plays them as a slideshow. */
export function heroImages(images) {
  return (images || [])
    .filter((i) => i.active !== false && i.image_url && (i.section === "HERO" || normKey(i.key).startsWith("hero_background")))
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map((i) => i.image_url);
}

export function copyByKey(copy, key, fallback) {
  const c = (copy || []).find((x) => x.key === key);
  return c?.value || fallback;
}