import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

let cache = null;
let promise = null;

export function loadPublicContent(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!promise || force) {
    promise = base44.functions
      .invoke("GetPublicContent")
      .then((res) => {
        cache = res.data || res || { logos: [], images: [], copy: [] };
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