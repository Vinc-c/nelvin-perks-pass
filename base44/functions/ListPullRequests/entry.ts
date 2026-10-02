import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const GH_API = 'https://api.github.com';
const HEADERS_EXTRA = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'nelvin-base44',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
    const headers = { Authorization: `Bearer ${accessToken}`, ...HEADERS_EXTRA };

    const meRes = await fetch(`${GH_API}/user`, { headers });
    if (!meRes.ok) {
      const t = await meRes.text();
      return Response.json({ error: `GitHub /user failed: ${meRes.status} ${t}` }, { status: 502 });
    }
    const me = await meRes.json();
    const login = me.login;

    // Optional repo filter (owner/name) passed from the page.
    let repoFilter = null;
    try {
      const body = await req.json?.();
      repoFilter = body && typeof body.repo === 'string' ? body.repo.trim() : null;
    } catch (_) {}

    const q = repoFilter
      ? `repo:${repoFilter} is:pr is:open archived:false`
      : `is:pr is:open user:${login} archived:false`;
    const url = `${GH_API}/search/issues?q=${encodeURIComponent(q)}&per_page=50&sort=updated&order=desc`;
    const prRes = await fetch(url, { headers });
    const prData = await prRes.json();
    if (!prRes.ok) {
      return Response.json({ error: `GitHub search failed: ${prRes.status} ${JSON.stringify(prData.message || prData)}` }, { status: 502 });
    }

    const items = (prData.items || []).map((it) => ({
      id: it.id,
      number: it.number,
      title: it.title,
      state: it.state,
      html_url: it.html_url,
      repo: it.repository_url ? it.repository_url.split('/').slice(-2).join('/') : null,
      author: it.user ? it.user.login : null,
      author_avatar: it.user ? it.user.avatar_url : null,
      created_at: it.created_at,
      updated_at: it.updated_at,
      draft: it.draft,
      comments: it.comments,
      labels: (it.labels || []).map((l) => l.name),
    }));

    // Distinct repo list with PR counts, for the filter dropdown.
    const repoCounts = {};
    for (const it of items) {
      if (!it.repo) continue;
      repoCounts[it.repo] = (repoCounts[it.repo] || 0) + 1;
    }
    const repos = Object.entries(repoCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return Response.json({ login, count: items.length, items, repos, query: q });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}