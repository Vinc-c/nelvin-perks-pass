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

export function imageByKey(images, key, fallback) {
  const img = (images || []).find((i) => i.key === key && i.active !== false);
  return img?.image_url || fallback;
}

export function copyByKey(copy, key, fallback) {
  const c = (copy || []).find((x) => x.key === key);
  return c?.value || fallback;
}