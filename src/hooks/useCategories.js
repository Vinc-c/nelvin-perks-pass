import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { OFFER_CATEGORIES } from "@/data/offerCategories";

// Loads category metadata managed by super admins (Category entity) and
// merges it with the hardcoded defaults, so the app keeps working even with
// no CMS rows. Inactive CMS rows hide the category; active rows override the
// default label / emoji / description / image.
export function useCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.Category
      .list("sort_order")
      .then((r) => {
        if (!alive) return;
        setRows(Array.isArray(r) ? r : r?.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const byValue = new Map();
  for (const d of OFFER_CATEGORIES) byValue.set(d.value, { ...d });
  for (const r of rows) {
    if (r.active === false) {
      byValue.delete(r.value);
      continue;
    }
    const base = byValue.get(r.value) || { emoji: "🏷️" };
    byValue.set(r.value, {
      value: r.value,
      label: r.label || base.label || r.value,
      emoji: r.emoji || base.emoji || "🏷️",
      description: r.description || base.description,
      image_url: r.image_url || base.image_url,
    });
  }

  const categories = [];
  const seen = new Set();
  for (const r of rows) {
    if (r.active === false || seen.has(r.value)) continue;
    seen.add(r.value);
    const base = byValue.get(r.value);
    categories.push({
      value: r.value,
      label: base?.label || r.value,
      emoji: base?.emoji || "🏷️",
      description: r.description,
      image_url: r.image_url,
    });
  }
  for (const d of OFFER_CATEGORIES) {
    if (!seen.has(d.value)) {
      seen.add(d.value);
      categories.push({ ...d });
    }
  }

  const meta = (value) =>
    byValue.get(value) || { label: value || "Autre", emoji: "🏷️" };

  return { categories, meta, loading };
}