import React from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import RichText from "@/components/marketing/RichText";
import { entities } from "@/api/entities";
import { useAsync } from "@/hooks/useAsync";
import { useSeo } from "@/lib/seo";
import { Spinner } from "@/components/UiFeedback";

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, loading } = useAsync(() => entities.BlogPost.filter({ slug, status: "PUBLISHED" }, "-published_at", 1).then((r) => r[0] || null), [slug], { initial: null });
  useSeo({
    title: post ? (post.seo_title || `${post.title} | Nelvin Blog`) : "",
    description: post ? (post.seo_description || post.excerpt || "") : "",
    image: post?.cover_url, path: `/blog/${slug}`,
    jsonLd: post && { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.seo_description || post.excerpt, image: post.cover_url, datePublished: post.published_at, author: { "@type": "Organization", name: post.author || "Nelvin Benefits" }, publisher: { "@type": "Organization", name: "Nelvin Benefits" } },
  });
  return (
    <div className="min-h-screen bg-white md:bg-[#FBFBFE]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/blog" className="text-sm font-medium text-emerald-700 hover:underline">← Blog</Link>
        {loading ? <Spinner /> : !post ? <p className="mt-10 text-slate-500">Article not found.</p> : (
          <article className="mt-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900">{post.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}{post.author ? ` · ${post.author}` : ""}</p>
            {post.cover_url && <img src={post.cover_url} alt="" className="mt-6 w-full rounded-2xl object-cover" />}
            <RichText text={post.body} className="mt-8" />
            <div className="mt-12 rounded-2xl bg-[#E82B2C] p-6 text-center text-white">
              <p className="text-lg font-medium">Save every day with Nelvin</p>
              <Link to="/pricing" className="mt-3 inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-medium text-[#E82B2C]">See plans</Link>
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
