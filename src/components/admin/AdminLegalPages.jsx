import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/api/supabaseClient";
import { callRpc } from "@/api/rpc";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/UiFeedback";
import BlogBodyEditor from "@/components/admin/BlogBodyEditor";
import { clearLegalCache } from "@/hooks/useLegalPage";
import { translations, loadLanguage } from "@/i18n/translations";
import { FileText, History, Mail, RotateCcw, Send, Undo2 } from "lucide-react";

const BUILT_IN = [
  { slug: "terms", label: "Terms of Service", prefix: "lg.terms", path: "/terms" },
  { slug: "privacy", label: "Privacy Policy", prefix: "lg.privacy", path: "/privacy" },
  { slug: "cookies", label: "Cookie Policy", prefix: "lg.cookies", path: "/cookies" },
  { slug: "refund-policy", label: "Refund Policy", prefix: "lg.refund", path: "/refund-policy" },
];
const LANGS = [["en", "English"], ["fr", "Français"]];
const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const EMPTY = { en: { title: "", body: "" }, fr: { title: "", body: "" } };

/** The page's built-in text as markdown, to use as a starting point. */
function builtInMarkdown(prefix, lang) {
  const dict = translations[lang] || {};
  const get = (k) => (dict[k] || translations.en[k] || "").replace(/<b>/g, "**").replace(/<\/b>/g, "**");
  const keys = Object.keys(translations.en).filter((k) => k.startsWith(`${prefix}.s`));
  const sections = [...new Set(keys.map((k) => k.split(".")[2]))].sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
  const parts = [];
  const intro = get(`${prefix}.intro`);
  if (intro) parts.push(intro);
  sections.forEach((s) => {
    parts.push(`## ${get(`${prefix}.${s}.t`)}`);
    keys.filter((k) => k.startsWith(`${prefix}.${s}.`) && !k.endsWith(".t")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach((k) => parts.push(get(k)));
  });
  return { title: get(`${prefix}.title`), body: parts.join("\n\n") };
}

export default function AdminLegalPages() {
  const { toast } = useToast();
  const [rows, setRows] = useState(null); // every legal_pages row
  const [slug, setSlug] = useState("terms");
  const [newSlug, setNewSlug] = useState("");
  const [lang, setLang] = useState("en");
  const [draft, setDraft] = useState(EMPTY);
  const [summary, setSummary] = useState({ en: "", fr: "" });
  const [notify, setNotify] = useState(true);
  const [count, setCount] = useState(null);
  const [versions, setVersions] = useState([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("legal_pages").select("slug,lang,title,body,version,updated_at");
    setRows(data || []);
  }, []);
  useEffect(() => { reload(); callRpc("legal_notify_count").then(setCount, () => setCount(null)); }, [reload]);

  const customSlugs = [...new Set((rows || []).map((r) => r.slug))].filter((s) => !BUILT_IN.some((b) => b.slug === s));
  const meta = BUILT_IN.find((b) => b.slug === slug);

  // Load the published override (or an empty form) when the selected page changes.
  useEffect(() => {
    if (rows === null) return;
    const next = { en: { ...EMPTY.en }, fr: { ...EMPTY.fr } };
    rows.filter((r) => r.slug === slug).forEach((r) => { next[r.lang] = { title: r.title, body: r.body }; });
    setDraft(next);
    setSummary({ en: "", fr: "" });
    supabase.from("legal_page_versions").select("id,lang,version,title,body,summary,created_date").eq("slug", slug).order("created_date", { ascending: false }).limit(30)
      .then(({ data }) => setVersions(data || []));
  }, [slug, rows]);

  const published = (rows || []).filter((r) => r.slug === slug);
  const setField = (k, v) => setDraft((d) => ({ ...d, [lang]: { ...d[lang], [k]: v } }));

  const loadBuiltIn = async () => {
    if (!meta) return;
    await Promise.all(LANGS.map(([l]) => (translations[l] ? null : loadLanguage(l))));
    setDraft({ en: builtInMarkdown(meta.prefix, "en"), fr: builtInMarkdown(meta.prefix, "fr") });
    toast({ title: "Built-in text loaded", description: "Edit it, then publish." });
  };

  const publish = async () => {
    const pages = {};
    LANGS.forEach(([l]) => { if (draft[l].title.trim() && draft[l].body.trim()) pages[l] = draft[l]; });
    if (!Object.keys(pages).length) { toast({ title: "Nothing to publish", description: "Fill in a title and a text.", variant: "destructive" }); return; }
    const who = notify ? `\n\nAll ${count ?? "?"} users who have already signed in will receive an email and an in-app notice.` : "\n\nNo notification will be sent.";
    if (!window.confirm(`Publish the new version of "${meta?.label || slug}" now?${who}`)) return;
    setBusy(true);
    try {
      const res = await callRpc("admin_publish_legal", { p_slug: slug, p_pages: pages, p_summary: summary, p_notify: notify });
      clearLegalCache();
      toast({ title: `Version ${res.version} published`, description: res.notified ? `${res.notified} users notified.` : "No notification sent." });
      await reload();
    } catch (e) {
      toast({ title: "Publish failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const revert = async () => {
    if (!window.confirm("Go back to the built-in text for this page? The history is kept.")) return;
    setBusy(true);
    const { error } = await supabase.from("legal_pages").delete().eq("slug", slug);
    setBusy(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    clearLegalCache();
    toast({ title: "Built-in text restored" });
    reload();
  };

  const createPage = () => {
    const s = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (s.length < 2) return;
    setSlug(s); setNewSlug("");
  };

  if (rows === null) return <Spinner />;
  const cur = draft[lang];
  const urlPath = meta?.path || `/page/${slug}`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-5 w-5 text-nv-emerald" /> Legal & information pages</h3>
        <p className="mt-1 text-sm text-slate-500">Edit the text shown on the public pages. Each save creates a numbered version you can come back to. You can email everyone who has already signed in when you publish a change.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...BUILT_IN.map((b) => [b.slug, b.label]), ...customSlugs.map((s) => [s, `/page/${s}`])].map(([s, label]) => (
            <button key={s} onClick={() => setSlug(s)} className={`rounded-full px-4 py-1.5 text-sm ${slug === s ? "bg-nv-deep text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {label}{rows.some((r) => r.slug === s) && <span className="ms-1.5 text-[10px] opacity-70">• edited</span>}
            </button>
          ))}
          {!meta && !customSlugs.includes(slug) && <span className="rounded-full bg-nv-deep px-4 py-1.5 text-sm text-white">/page/{slug} (new)</span>}
        </div>
        <div className="mt-3 flex max-w-sm gap-2">
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="new-page-name" aria-label="New page address" className={inp} />
          <button onClick={createPage} className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50">New page</button>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {LANGS.map(([l, name]) => <button key={l} onClick={() => setLang(l)} className={`rounded-md px-3 py-1 text-sm ${lang === l ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>{name}{draft[l].body.trim() ? " ✓" : ""}</button>)}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {meta && <button onClick={loadBuiltIn} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /> Load built-in text</button>}
            <a href={urlPath} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">View page ↗</a>
            {published.length > 0 && meta && <button onClick={revert} disabled={busy} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-rose-600"><Undo2 className="h-4 w-4" /> Back to built-in</button>}
          </div>
        </div>
        <label className="block text-sm font-medium text-slate-700">Page title ({lang.toUpperCase()})<input value={cur.title} onChange={(e) => setField("title", e.target.value)} maxLength={200} className={`${inp} mt-1`} /></label>
        <div><p className="text-sm font-medium text-slate-700">Text ({lang.toUpperCase()}) <span className="font-normal text-slate-400">— ## heading, **bold**, - list, select text then the link button</span></p><div className="mt-1"><BlogBodyEditor key={`${slug}-${lang}-${published.length}`} value={cur.body} onChange={(v) => setField("body", v)} /></div></div>
        <p className="text-xs text-slate-400">If a language is left empty, visitors in that language see the other published language (or the built-in text when nothing is published).</p>

        <div className="rounded-xl bg-slate-50 p-4">
          <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 accent-nv-emerald" />
            <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email everyone who has already signed in{count != null && ` (${count})`} about this change</span>
          </label>
          {notify && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {LANGS.map(([l, name]) => <label key={l} className="text-xs text-slate-500">What changed? ({name})<textarea rows={2} value={summary[l]} onChange={(e) => setSummary((s) => ({ ...s, [l]: e.target.value }))} className={`${inp} mt-1`} placeholder={l === "fr" ? "Ex. : nous avons précisé les remboursements" : "e.g. We clarified our refund rules"} /></label>)}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">Emails and in-app notices go in French or English depending on the user's language. Users who muted email notifications still receive legal notices.</p>
        </div>
        <button onClick={publish} disabled={busy} className="flex items-center gap-2 rounded-lg bg-nv-emerald px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Send className="h-4 w-4" /> {busy ? "Publishing…" : "Publish new version"}</button>
      </div>

      {versions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900"><History className="h-4 w-4" /> Version history</h4>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><strong>v{v.version}</strong> · {v.lang.toUpperCase()} · {new Date(v.created_date).toLocaleString("en-GB")}{v.summary && <span className="text-slate-500"> — {v.summary}</span>}</span>
                <button onClick={() => { setLang(v.lang); setDraft((d) => ({ ...d, [v.lang]: { title: v.title, body: v.body } })); window.scrollTo({ top: 0, behavior: "smooth" }); toast({ title: `v${v.version} loaded in the editor`, description: "Publish to make it live again." }); }} className="rounded-lg border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">Restore in editor</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
