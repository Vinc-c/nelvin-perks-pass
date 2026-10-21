import { useEffect, useState } from "react";
import { entities } from "@/api/entities";
import { OFFER_CATEGORIES, CATEGORY_LABELS_EN } from "@/data/offerCategories";
import { useI18n } from "@/i18n/I18nContext";

// Loads category metadata managed by super admins (Category entity) and
// merges it with the hardcoded defaults, so the app keeps working even with
// no CMS rows. Inactive CMS rows hide the category; active rows override the
// default label / emoji / description / image.
export function useCategories() {
  const { t } = useI18n();
  // Built-in labels follow the viewer's language; a label an admin edited by hand is kept as typed.
  const localized = (value, label) => {
    const def = OFFER_CATEGORIES.find((c) => c.value === value);
    const untouched = !label || (def && (label === def.label || label === CATEGORY_LABELS_EN[value]));
    const text = t(`cat.${value}`);
    return untouched && text !== `cat.${value}` ? text : label || def?.label || value;
  };
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    entities.Category
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
  for (const d of OFFER_CATEGORIES) byValue.set(d.value, { ...d, label: localized(d.value, d.label) });
  for (const r of rows) {
    if (r.active === false) {
      byValue.delete(r.value);
      continue;
    }
    const base = byValue.get(r.value) || { emoji: "🏷️" };
    byValue.set(r.value, {
      value: r.value,
      label: localized(r.value, r.label || base.label),
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
      categories.push({ ...d, label: localized(d.value, d.label) });
    }
  }

  const meta = (value) =>
    byValue.get(value) || { label: value || "Autre", emoji: "🏷️" };

  return { categories, meta, loading };
}