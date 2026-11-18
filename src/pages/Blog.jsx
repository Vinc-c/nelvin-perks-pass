import React from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import SiteBanner from "@/components/marketing/SiteBanner";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useSeo } from "@/lib/seo";
import { Spinner } from "@/components/UiFeedback";

export default function Blog() {
  useSeo({ title: "Nelvin Blog — savings, benefits and partners across Africa", description: "News, guides and stories about employee benefits, cashback and local partners with Nelvin Benefits.", path: "/blog" });
  const { data: posts, loading } = useAsync(() => entities.BlogPost.filter({ status: "PUBLISHED" }, "-published_at", 50), [], { initial: [] });
  return (
    <div className="min-h-screen bg-white md:bg-[#FBFBFE]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold text-slate-900">Blog</h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600">Guides and news on benefits, cashback and local partners.</p>
        <SiteBanner placement="BLOG" className="mt-6" />
        {loading ? <Spinner /> : posts.length === 0 ? <p className="mt-10 text-slate-500">No articles yet. Check back soon.</p> : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
                  {p.cover_url && <img src={p.cover_url} alt="" loading="lazy" className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]" />}
                  <div className="p-5">
                    <p className="text-xs text-slate-500">{p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}{p.author ? ` · ${p.author}` : ""}</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">{p.title}</h2>
                    {p.excerpt && <p className="mt-2 text-sm text-slate-600">{p.excerpt}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
