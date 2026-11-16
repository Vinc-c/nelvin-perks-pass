import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { entities } from "@/api/entities";
import { setMeta } from "@/lib/seo";

let cache = null;
const load = () => (cache ||= entities.SeoPage.list("path", 500).catch(() => []));

/** Applies SEO overrides set in Admin → Marketing → SEO to the page matching the current path. */
export default function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    let cancelled = false;
    let restore = null;
    load().then((rows) => {
      const row = rows.find((r) => r.path === pathname);
      if (cancelled || !row) return;
      const prevTitle = document.title;
      if (row.title) { document.title = row.title; setMeta("property", "og:title", row.title); }
      if (row.description) { setMeta("name", "description", row.description); setMeta("property", "og:description", row.description); }
      if (row.og_image) setMeta("property", "og:image", row.og_image);
      if (row.noindex) setMeta("name", "robots", "noindex, nofollow");
      restore = () => { document.title = prevTitle; if (row.noindex) setMeta("name", "robots", null); };
    });
    return () => { cancelled = true; restore?.(); };
  }, [pathname]);
  return null;
}
