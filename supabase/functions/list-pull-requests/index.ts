// Admin-only: lists open GitHub pull requests. Requires a GITHUB_TOKEN secret
// (fine-grained token with read access to pull requests).
import { adminClient, getCaller, isAdminRole, json, MFA_REQUIRED, readJson, serve } from "../_shared/http.ts";

const GH_API = "https://api.github.com";

serve(async (req) => {
  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: "Unauthorized" }, 401);
  if (!isAdminRole(caller.profile.role)) return json({ error: "Forbidden" }, 403);
  if (!caller.mfaOk) return json(MFA_REQUIRED, 403);

  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) return json({ error: "GITHUB_TOKEN non configuré dans les secrets des Edge Functions." }, 500);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "nelvin-perks-pass",
  };

  const meRes = await fetch(`${GH_API}/user`, { headers });
  if (!meRes.ok) return json({ error: `GitHub /user failed: ${meRes.status}` }, 502);
  const me = await meRes.json();
  const login = me.login;

  const body = await readJson(req);
  const repoFilter = typeof body.repo === "string" && /^[\w.-]+\/[\w.-]+$/.test(body.repo.trim()) ? body.repo.trim() : null;
  const q = repoFilter ? `repo:${repoFilter} is:pr is:open archived:false` : `is:pr is:open user:${login} archived:false`;
  const prRes = await fetch(`${GH_API}/search/issues?q=${encodeURIComponent(q)}&per_page=50&sort=updated&order=desc`, { headers });
  const prData = await prRes.json();
  if (!prRes.ok) return json({ error: `GitHub search failed: ${prRes.status} ${prData.message || ""}` }, 502);

  // deno-lint-ignore no-explicit-any
  const items = (prData.items || []).map((it: any) => ({
    id: it.id,
    number: it.number,
    title: it.title,
    state: it.state,
    html_url: it.html_url,
    repo: it.repository_url ? it.repository_url.split("/").slice(-2).join("/") : null,
    author: it.user?.login ?? null,
    author_avatar: it.user?.avatar_url ?? null,
    created_at: it.created_at,
    updated_at: it.updated_at,
    draft: it.draft,
    comments: it.comments,
    labels: (it.labels || []).map((l: { name: string }) => l.name),
  }));

  const repoCounts: Record<string, number> = {};
  for (const it of items) if (it.repo) repoCounts[it.repo] = (repoCounts[it.repo] || 0) + 1;
  const repos = Object.entries(repoCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return json({ login, count: items.length, items, repos, query: q });
});
