import React from "react";

const LINK = /\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g;

function inline(text) {
  const out = []; let last = 0; let m; let i = 0;
  LINK.lastIndex = 0;
  while ((m = LINK.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<a key={i++} href={m[2]} className="font-medium text-emerald-700 underline" {...(m[2].startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{m[1]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Safe mini-markdown for blog posts: ## headings, - lists, [links](https://…), paragraphs. No raw HTML. */
export default function RichText({ text, className = "" }) {
  const blocks = String(text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 text-[17px] leading-relaxed text-slate-700 ${className}`}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="pt-4 text-2xl font-semibold text-slate-900">{b.slice(3)}</h2>;
        if (b.startsWith("### ")) return <h3 key={i} className="pt-2 text-xl font-semibold text-slate-900">{b.slice(4)}</h3>;
        if (b.split("\n").every((l) => l.startsWith("- "))) return <ul key={i} className="list-disc space-y-1 ps-6">{b.split("\n").map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        return <p key={i}>{inline(b)}</p>;
      })}
    </div>
  );
}
