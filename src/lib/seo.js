import { useEffect } from "react";

/** URL-safe slug (accents removed), same rule as the SQL `slugify`. */
export const slugify = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

/**
 * Sets the document title, description, Open Graph / Twitter tags, canonical
 * link and an optional JSON-LD block for the current page, and restores the
 * previous values when the page unmounts.
 */
export function useSeo({ title, description, image, path, jsonLd }) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    if (!title) return undefined;
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const origin = window.location.origin;
    const url = path ? origin + path : window.location.href;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    let canonical = document.head.querySelector('link[rel="canonical"]');
    const hadCanonical = !!canonical;
    const prevHref = canonical?.getAttribute("href");
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.setAttribute("href", url);
    let script = null;
    if (ld) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.nelvinSeo = "1";
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      document.title = prevTitle;
      setMeta("name", "description", prevDesc);
      if (script) script.remove();
      if (!hadCanonical) canonical.remove(); else canonical.setAttribute("href", prevHref);
    };
  }, [title, description, image, path, ld]);
}

/** Public URL of an offer: the SEO slug when set, otherwise the id form. */
export const offerPath = (o) => (o?.slug ? `/offre/${o.slug}` : `/offer-details?id=${o?.id}`);
