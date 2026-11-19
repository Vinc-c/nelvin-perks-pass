import React from "react";

const TOKEN = /(\[[^\]]+\]\((?:https:\/\/[^\s)]+|\/[^\s)]*)\)|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
const LINK = /^\[([^\]]+)\]\((.+)\)$/;

function inline(text) {
  return text.split(TOKEN).filter((x) => x !== "").map((part, i) => {
    const l = LINK.exec(part);
    if (l) return <a key={i} href={l[2]} className="font-medium text-nv-emerald underline underline-offset-2 hover:text-nv-bronze" {...(l[2].startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{l[1]}</a>;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    if (/^\*[^*\n]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/** Safe mini-markdown for blog posts: ## headings, - lists, [links](https://…), **bold**, *italic*, paragraphs. No raw HTML. */
export default function RichText({ text, className = "" }) {
  const blocks = String(text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 text-[17px] leading-relaxed text-slate-700 ${className}`}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="pt-4 text-2xl font-semibold text-slate-900">{inline(b.slice(3))}</h2>;
        if (b.startsWith("### ")) return <h3 key={i} className="pt-2 text-xl font-semibold text-slate-900">{b.slice(4)}</h3>;
        if (b.split("\n").every((l) => l.startsWith("- "))) return <ul key={i} className="list-disc space-y-1 ps-6">{b.split("\n").map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(b)}</p>;
      })}
    </div>
  );
}
