import React, { useRef, useState } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, Eye, Pencil, Check, X } from "lucide-react";
import RichText from "@/components/marketing/RichText";

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

/** Blog body: select text, press the link button, paste the URL — the text becomes a link. */
export default function BlogBodyEditor({ value, onChange }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);
  const [linkDraft, setLinkDraft] = useState(null); // { start, end, url }
  const [error, setError] = useState("");

  const sel = () => {
    const el = ref.current;
    return { start: el.selectionStart, end: el.selectionEnd, el };
  };
  const replace = (start, end, text, selectFrom, selectTo) => {
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => { const el = ref.current; if (!el) return; el.focus(); el.setSelectionRange(selectFrom ?? start + text.length, selectTo ?? start + text.length); });
  };
  const wrap = (mark) => {
    const { start, end } = sel();
    const picked = value.slice(start, end) || "text";
    replace(start, end, `${mark}${picked}${mark}`, start + mark.length, start + mark.length + picked.length);
  };
  const prefixLines = (prefix) => {
    const { start, end } = sel();
    const from = value.lastIndexOf("\n", start - 1) + 1;
    const to = end;
    const block = value.slice(from, to || from) || "text";
    const out = block.split("\n").map((l) => (l.startsWith(prefix) ? l : prefix + l)).join("\n");
    replace(from, to || from, out);
  };
  const openLink = () => {
    const { start, end } = sel();
    setError("");
    setLinkDraft({ start, end, url: "", text: value.slice(start, end) });
  };
  const applyLink = () => {
    let url = linkDraft.url.trim();
    if (!url) return setError("Paste a URL");
    if (!/^(https:\/\/|\/)/.test(url)) url = /^[\w-]+(\.[\w-]+)+/.test(url) ? `https://${url}` : url;
    if (!/^(https:\/\/[^\s)]+|\/[^\s)]*)$/.test(url)) return setError("Use a full https:// link or an internal /path");
    const text = (linkDraft.text || "").trim() || url.replace(/^https:\/\//, "");
    replace(linkDraft.start, linkDraft.end, `[${text}](${url})`);
    setLinkDraft(null);
  };
  const Btn = ({ onClick, label, children, active }) => (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 ${active ? "bg-slate-100" : ""}`}>{children}</button>
  );

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
        <Btn onClick={() => prefixLines("## ")} label="Heading"><Heading2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => prefixLines("### ")} label="Subheading"><Heading3 className="h-4 w-4" /></Btn>
        <Btn onClick={() => wrap("**")} label="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => wrap("*")} label="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => prefixLines("- ")} label="List"><List className="h-4 w-4" /></Btn>
        <Btn onClick={openLink} label="Add link to selected text"><Link2 className="h-4 w-4" /></Btn>
        <button type="button" onClick={() => setPreview((p) => !p)} className="ms-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
          {preview ? <><Pencil className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
        </button>
      </div>
      {linkDraft && !preview && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-amber-50/60 p-2">
          <span className="max-w-[10rem] truncate text-xs text-slate-600">{linkDraft.text ? `“${linkDraft.text}”` : "No text selected"}</span>
          {!linkDraft.text && <input value={linkDraft.text} onChange={(e) => setLinkDraft({ ...linkDraft, text: e.target.value })} placeholder="Link text" aria-label="Link text" className={`${inp} h-9 flex-1 min-w-[8rem]`} />}
          <input autoFocus value={linkDraft.url} onChange={(e) => setLinkDraft({ ...linkDraft, url: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } if (e.key === "Escape") setLinkDraft(null); }} placeholder="https://… or /pricing" aria-label="Link URL" className={`${inp} h-9 flex-1 min-w-[12rem]`} />
          <button type="button" onClick={applyLink} className="flex h-9 items-center gap-1 rounded-lg bg-nv-emerald px-3 text-sm font-medium text-white"><Check className="h-4 w-4" /> Link</button>
          <button type="button" onClick={() => setLinkDraft(null)} aria-label="Cancel" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          {error && <p className="w-full text-xs text-rose-600">{error}</p>}
        </div>
      )}
      {preview ? (
        <div className="min-h-[18rem] p-4"><RichText text={value} /></div>
      ) : (
        <textarea ref={ref} rows={14} value={value} onChange={(e) => onChange(e.target.value)} className="block w-full resize-y rounded-b-lg p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-nv-emerald/30" />
      )}
    </div>
  );
}
