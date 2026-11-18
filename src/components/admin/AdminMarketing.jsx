import React, { useState } from "react";
import { Plus, Trash2, Save, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/seo";
import ImageUploader from "@/components/admin/ImageUploader";
import { EmptyState, Spinner } from "@/components/UiFeedback";

const inp = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const Count = ({ v = "", max }) => <span className={`text-[11px] ${v.length > max ? "text-rose-600" : "text-slate-400"}`}>{v.length}/{max}</span>;

/* ------------------------------- Blog ------------------------------- */
function BlogEditor({ post, onDone }) {
  const { toast } = useToast();
  const [f, setF] = useState({ title: "", slug: "", excerpt: "", body: "", cover_url: "", seo_title: "", seo_description: "", status: "DRAFT", author: "Nelvin team", ...post });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target ? e.target.value : e }));
  const save = async (status) => {
    if (!f.title.trim()) return toast({ title: "Title required", variant: "destructive" });
    setBusy(true);
    const row = { title: f.title.trim(), slug: slugify(f.slug || f.title), excerpt: f.excerpt || null, body: f.body, cover_url: f.cover_url || null, seo_title: f.seo_title || null, seo_description: f.seo_description || null, author: f.author || null, status,
      published_at: status === "PUBLISHED" ? (f.published_at || new Date().toISOString()) : f.published_at || null };
    try {
      if (post?.id) await entities.BlogPost.update(post.id, row); else await entities.BlogPost.create(row);
      toast({ title: status === "PUBLISHED" ? "Article published" : "Draft saved" });
      onDone();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium text-slate-700">Title<input value={f.title} onChange={set("title")} maxLength={160} className={inp} /></label>
      <label className="block text-sm font-medium text-slate-700">URL slug<input value={f.slug} onChange={set("slug")} placeholder={slugify(f.title)} className={inp} /></label>
      <label className="block text-sm font-medium text-slate-700">Excerpt <Count v={f.excerpt || ""} max={300} /><textarea rows={2} value={f.excerpt || ""} onChange={set("excerpt")} className={inp} /></label>
      <ImageUploader label="Cover image" value={f.cover_url} onChange={set("cover_url")} />
      <label className="block text-sm font-medium text-slate-700">Body <span className="font-normal text-slate-400">(## heading, - list, [text](https://link))</span><textarea rows={12} value={f.body} onChange={set("body")} className={`${inp} font-mono`} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">SEO title <Count v={f.seo_title || ""} max={70} /><input value={f.seo_title || ""} onChange={set("seo_title")} maxLength={70} className={inp} /></label>
        <label className="block text-sm font-medium text-slate-700">SEO description <Count v={f.seo_description || ""} max={170} /><input value={f.seo_description || ""} onChange={set("seo_description")} maxLength={170} className={inp} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => save("DRAFT")} className="flex items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-sm"><Save className="h-4 w-4" /> Save draft</button>
        <button disabled={busy} onClick={() => save("PUBLISHED")} className="rounded-lg bg-nv-emerald px-4 py-2 text-sm font-medium text-white">Publish</button>
        <button onClick={onDone} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
      </div>
    </div>
  );
}
function BlogTab() {
  const { data, loading, reload } = useAsync(() => entities.BlogPost.list("-created_date", 200), [], { initial: [] });
  const [edit, setEdit] = useState(null);
  const { toast } = useToast();
  if (edit) return <BlogEditor post={edit === "new" ? null : edit} onDone={() => { setEdit(null); reload(); }} />;
  if (loading && !data.length) return <Spinner />;
  return (
    <div>
      <button onClick={() => setEdit("new")} className="mb-4 flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" /> New article</button>
      {data.length === 0 ? <EmptyState title="No articles yet" description="Write the first one to start ranking on search engines." /> : (
        <ul className="space-y-2">{data.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <button onClick={() => setEdit(p)} className="min-w-0 text-start"><p className="truncate text-sm font-medium text-slate-900">{p.title}</p><p className="text-xs text-slate-500">/blog/{p.slug}</p></button>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{p.status}</span>
              {p.status === "PUBLISHED" && <Link to={`/blog/${p.slug}`} aria-label="View" className="p-1 text-slate-500"><Eye className="h-4 w-4" /></Link>}
              <button aria-label="Delete" onClick={async () => { if (!window.confirm("Delete this article?")) return; try { await entities.BlogPost.delete(p.id); reload(); } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); } }} className="p-1 text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}</ul>
      )}
    </div>
  );
}

/* ------------------------------ Banners ------------------------------ */
const PLACEMENTS = { HOME_TOP: "Landing – top", HOME_MID: "Landing – middle", MEMBER_HOME: "Member Home", BLOG: "Blog" };
function BannerTab() {
  const { data, loading, reload } = useAsync(() => entities.SiteBanner.list("sort_order", 100), [], { initial: [] });
  const { toast } = useToast();
  const [f, setF] = useState({ placement: "HOME_MID", title: "", subtitle: "", image_url: "", cta_label: "", cta_url: "" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target ? e.target.value : e }));
  const add = async () => {
    if (!f.title.trim()) return toast({ title: "Title required", variant: "destructive" });
    try { await entities.SiteBanner.create({ ...f, subtitle: f.subtitle || null, image_url: f.image_url || null, cta_label: f.cta_label || null, cta_url: f.cta_url || null }); setF({ ...f, title: "", subtitle: "", image_url: "", cta_label: "", cta_url: "" }); reload(); toast({ title: "Banner created" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };
  if (loading && !data.length) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">New banner</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">Placement<select value={f.placement} onChange={set("placement")} className={inp}>{Object.entries(PLACEMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-sm text-slate-700">Title<input value={f.title} onChange={set("title")} maxLength={120} className={inp} /></label>
          <label className="text-sm text-slate-700 sm:col-span-2">Subtitle<input value={f.subtitle} onChange={set("subtitle")} maxLength={240} className={inp} /></label>
          <label className="text-sm text-slate-700">Button label<input value={f.cta_label} onChange={set("cta_label")} maxLength={40} className={inp} /></label>
          <label className="text-sm text-slate-700">Button link (/path or https://…)<input value={f.cta_url} onChange={set("cta_url")} className={inp} /></label>
        </div>
        <ImageUploader label="Background image" value={f.image_url} onChange={set("image_url")} />
        <button onClick={add} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Create banner</button>
      </div>
      <ul className="space-y-2">{data.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="min-w-0"><p className="truncate font-medium text-slate-900">{b.title}</p><p className="text-xs text-slate-500">{PLACEMENTS[b.placement]}</p></div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={b.active} onChange={async (e) => { await entities.SiteBanner.update(b.id, { active: e.target.checked }); reload(); }} /> Live</label>
            <button aria-label="Delete" onClick={async () => { await entities.SiteBanner.delete(b.id); reload(); }} className="p-1 text-rose-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        </li>
      ))}</ul>
    </div>
  );
}

/* -------------------------------- SEO -------------------------------- */
const PAGES = ["/", "/pricing", "/merchant", "/merchant-directory", "/merchant-map", "/blog", "/demo"];
function SeoTab() {
  const { data, loading, reload } = useAsync(() => entities.SeoPage.list("path", 200), [], { initial: [] });
  const { toast } = useToast();
  const [path, setPath] = useState("/");
  const row = data.find((r) => r.path === path) || {};
  const [f, setF] = useState(null);
  const cur = f && f.path === path ? f : { path, title: row.title || "", description: row.description || "", og_image: row.og_image || "", noindex: !!row.noindex };
  const set = (k) => (e) => setF({ ...cur, [k]: e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e });
  const save = async () => {
    try {
      const body = { path, title: cur.title || null, description: cur.description || null, og_image: cur.og_image || null, noindex: cur.noindex };
      if (row.path) await entities.SeoPage.update(path, body); else await entities.SeoPage.create(body);
      toast({ title: "SEO saved" }); setF(null); reload();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };
  if (loading && !data.length) return <Spinner />;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium text-slate-700">Page<select value={path} onChange={(e) => { setPath(e.target.value); setF(null); }} className={inp}>{PAGES.map((p) => <option key={p} value={p}>{p}{data.some((r) => r.path === p) ? " ✓" : ""}</option>)}</select></label>
      <label className="block text-sm font-medium text-slate-700">Title <Count v={cur.title} max={70} /><input value={cur.title} onChange={set("title")} maxLength={70} className={inp} /></label>
      <label className="block text-sm font-medium text-slate-700">Description <Count v={cur.description} max={170} /><textarea rows={2} value={cur.description} onChange={set("description")} maxLength={170} className={inp} /></label>
      <ImageUploader label="Share image (1200×630)" value={cur.og_image} onChange={set("og_image")} />
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={cur.noindex} onChange={set("noindex")} /> Hide from search engines (noindex)</label>
      <div className="rounded-lg bg-slate-50 p-3 text-xs"><p className="text-blue-700">{cur.title || "Page title"}</p><p className="text-emerald-700">nelvinbenefits.com{path}</p><p className="text-slate-600">{cur.description || "Meta description preview"}</p></div>
      <button onClick={save} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Save SEO</button>
    </div>
  );
}

/** Marketing module: blog, promotional banners and per-page SEO. */
export default function AdminMarketing() {
  const [tab, setTab] = useState("blog");
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["blog", "Blog"], ["banners", "Banners"], ["seo", "SEO pages"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-medium ${tab === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{l}</button>
        ))}
        <Link to="/admin?section=cms_logos" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Logos & images →</Link>
      </div>
      {tab === "blog" && <BlogTab />}
      {tab === "banners" && <BannerTab />}
      {tab === "seo" && <SeoTab />}
    </div>
  );
}
