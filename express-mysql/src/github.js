const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function client() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'github-profile-analyzer',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return axios.create({ baseURL: GITHUB_API, headers, timeout: 15000 });
}

async function fetchUser(username) {
  const { data } = await client().get(`/users/${encodeURIComponent(username)}`);
  return data;
}

async function fetchAllRepos(username) {
  const http = client();
  const perPage = 100;
  let page = 1;
  const all = [];
  // Cap at 5 pages (500 repos) to stay polite.
  while (page <= 5) {
    const { data } = await http.get(`/users/${encodeURIComponent(username)}/repos`, {
      params: { per_page: perPage, page, type: 'owner', sort: 'updated' },
    });
    all.push(...data);
    if (data.length < perPage) break;
    page += 1;
  }
  return all;
}

function summarizeRepos(repos) {
  let totalStars = 0;
  let totalForks = 0;
  const langCounts = {};

  for (const r of repos) {
    if (r.fork) continue; // skip forks for stars/lang signal
    totalStars += r.stargazers_count || 0;
    totalForks += r.forks_count || 0;
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  }

  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count }));

  const topRepos = [...repos]
    .filter(r => !r.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
    }));

  return {
    totalStars,
    totalForks,
    topLanguage: languages[0]?.language || null,
    languages,
    topRepos,
  };
}

module.exports = { fetchUser, fetchAllRepos, summarizeRepos };
