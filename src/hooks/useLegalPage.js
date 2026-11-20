import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useI18n } from "@/i18n/I18nContext";

const cache = new Map(); // slug -> { rows, at }
const TTL = 60_000;

export function clearLegalCache(slug) { if (slug) cache.delete(slug); else cache.clear(); }

async function load(slug) {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL) return hit.rows;
  const { data, error } = await supabase.from("legal_pages").select("lang,title,body,version,updated_at").eq("slug", slug);
  if (error) throw error;
  cache.set(slug, { rows: data || [], at: Date.now() });
  return data || [];
}

/**
 * Admin-edited version of a legal / info page, if one exists.
 * Picks the visitor's language, then English; null means "use the built-in text".
 */
export function useLegalPage(slug) {
  const { lang } = useI18n();
  const hit = cache.get(slug);
  const [rows, setRows] = useState(hit ? hit.rows : null);
  useEffect(() => {
    let live = true;
    load(slug).then((r) => live && setRows(r), () => live && setRows([]));
    return () => { live = false; };
  }, [slug]);
  if (rows === null) return { loading: true, page: null };
  const page = rows.find((r) => r.lang === lang) || rows.find((r) => r.lang === "en") || rows[0] || null;
  return { loading: false, page };
}
