import React, { useState, useEffect, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { base44 } from "@/api/base44Client";
import { EmptyState, Spinner } from "@/components/UiFeedback";
import { RefreshCw, ExternalLink, GitPullRequest, MessageSquare, GitBranch } from "lucide-react";
import moment from "moment";

function timeAgo(iso) {
  return iso ? moment(iso).fromNow() : "";
}

export default function PullRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [repo, setRepo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("ListPullRequests", repo ? { repo } : {});
      setData(res.data);
    } catch (e) {
      setError(e.message || "Échec du chargement");
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalOpen = data?.count ?? 0;

  return (
    <PortalLayout title="Pull requests">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            PR en attente {data?.login ? `• @${data.login}` : ""}
          </h2>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement…" : `${totalOpen} pull request${totalOpen > 1 ? "s" : ""} ouverte${totalOpen > 1 ? "s" : ""}${repo ? ` sur ${repo}` : " sur vos dépôts"}`}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="not-pill flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      {/* Repo filter */}
      {data?.repos?.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRepo("")}
            className={`not-pill rounded-full px-3 py-1.5 text-xs font-medium transition ${!repo ? "bg-brand text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
          >
            Tous les dépôts
          </button>
          {data.repos.map((r) => (
            <button
              key={r.name}
              onClick={() => setRepo(r.name)}
              className={`not-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${repo === r.name ? "bg-brand text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              {r.name}
              <span className={`ml-1 rounded-full px-1.5 text-[10px] ${repo === r.name ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner label="Chargement des pull requests…" />
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : !data || data.count === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="Aucune PR ouverte"
          description={repo ? `Aucune pull request ouverte sur ${repo}.` : "Aucune pull request ouverte sur vos dépôts GitHub."}
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((pr) => (
            <a
              key={pr.id}
              href={pr.html_url}
              target="_blank"
              rel="noreferrer"
              className="not-pill group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-emerald-700">{pr.title}</h3>
                  {pr.draft && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Draft</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{pr.repo}</span> #{pr.number} • par {pr.author} • mis à jour {timeAgo(pr.updated_at)}
                </p>
                {pr.labels?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pr.labels.map((l) => (
                      <span key={l} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{l}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1" title="Commentaires">
                  <MessageSquare className="h-4 w-4" /> {pr.comments}
                </span>
                <ExternalLink className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <GitPullRequest className="h-3.5 w-3.5" />
        Source : GitHub Search API • {repo ? `repo:${repo}` : `user:${data?.login || "you"}`} • is:pr is:open
      </p>
    </PortalLayout>
  );
}