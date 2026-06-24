import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Search, Star, GitFork, Users, BookMarked, MapPin, Link as LinkIcon, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { logout, observeAuthState } from "@/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitHub Profile Analyzer" },
      { name: "description", content: "Analyze any public GitHub profile — repos, stars, languages, top projects." },
      { property: "og:title", content: "GitHub Profile Analyzer" },
      { property: "og:description", content: "Analyze any public GitHub profile — repos, stars, languages, top projects." },
    ],
  }),
  component: Index,
});

type RepoSummary = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
};

type Profile = {
  github_id: number;
  username: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  total_stars: number;
  total_forks: number;
  top_language: string | null;
  languages: { language: string; count: number }[];
  top_repos: RepoSummary[];
  account_created_at: string;
  analyzed_at: string;
};

const STORAGE_KEY = "gh_profile_analyzer_v1";

function loadStored(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStored(list: Profile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

async function analyzeUsername(username: string): Promise<Profile> {
  const u = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (u.status === 404) throw new Error("GitHub user not found");
  if (!u.ok) throw new Error(`GitHub API error (${u.status})`);
  const user = await u.json();

  const r = await fetch(
    `https://api.github.com/users/${encodeURIComponent(user.login)}/repos?per_page=100&type=owner&sort=updated`,
  );
  const repos: any[] = r.ok ? await r.json() : [];

  let stars = 0;
  let forks = 0;
  const langs: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.fork) continue;
    stars += repo.stargazers_count || 0;
    forks += repo.forks_count || 0;
    if (repo.language) langs[repo.language] = (langs[repo.language] || 0) + 1;
  }
  const languages = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({ language, count }));
  const topRepos: RepoSummary[] = [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
    }));

  return {
    github_id: user.id,
    username: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    blog: user.blog,
    public_repos: user.public_repos,
    public_gists: user.public_gists,
    followers: user.followers,
    following: user.following,
    total_stars: stars,
    total_forks: forks,
    top_language: languages[0]?.language || null,
    languages,
    top_repos: topRepos,
    account_created_at: user.created_at,
    analyzed_at: new Date().toISOString(),
  };
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Index() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Profile | null>(null);
  const [stored, setStored] = useState<Profile[]>([]);
  const [authUser, setAuthUser] = useState<any | null>(undefined);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setStored(loadStored());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = observeAuthState((user) => {
      setAuthUser(user);
      setAuthLoading(false);
      if (!user) {
        router.navigate({ to: "/login" });
      }
    });

    return unsubscribe;
  }, [router]);

  async function handleAnalyze(e?: React.FormEvent) {
    e?.preventDefault();
    const name = username.trim().replace(/^@/, "");
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await analyzeUsername(name);
      setActive(profile);
      const next = [profile, ...stored.filter((p) => p.username.toLowerCase() !== profile.username.toLowerCase())];
      setStored(next);
      saveStored(next);
    } catch (err: any) {
      setError(err.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(u: string) {
    const next = stored.filter((p) => p.username !== u);
    setStored(next);
    saveStored(next);
    if (active?.username === u) setActive(null);
  }

  const maxLang = active?.languages[0]?.count ?? 1;

  const handleLogout = async () => {
    try {
      await logout();
      router.navigate({ to: "/login" });
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking authentication…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <Github className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">GitHub Profile Analyzer</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {authUser ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <form onSubmit={handleAnalyze} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter a GitHub username (e.g. torvalds)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !username.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Analyze
          </Button>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            {active ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={active.avatar_url} alt={active.username} />
                      <AvatarFallback>{active.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <h2 className="text-xl font-semibold">{active.name || active.username}</h2>
                        <a
                          href={`https://github.com/${active.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          @{active.username}
                        </a>
                      </div>
                      {active.bio && <p className="mt-1 text-sm text-foreground/80">{active.bio}</p>}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {active.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {active.location}
                          </span>
                        )}
                        {active.blog && (
                          <a
                            href={active.blog.startsWith("http") ? active.blog : `https://${active.blog}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            {active.blog.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                        <span>Joined {new Date(active.account_created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat icon={BookMarked} label="Repos" value={active.public_repos} />
                  <Stat icon={Users} label="Followers" value={active.followers} />
                  <Stat icon={Star} label="Total stars" value={active.total_stars} />
                  <Stat icon={GitFork} label="Total forks" value={active.total_forks} />
                </div>

                {active.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Languages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {active.languages.map((l) => (
                        <div key={l.language} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{l.language}</span>
                            <span className="text-muted-foreground">{l.count} repo{l.count > 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${(l.count / maxLang) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {active.top_repos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top repositories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {active.top_repos.map((r) => (
                        <a
                          key={r.full_name}
                          href={r.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-md border p-3 transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{r.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {r.stars}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <GitFork className="h-3 w-3" />
                                {r.forks}
                              </span>
                            </div>
                          </div>
                          {r.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                          )}
                          {r.language && (
                            <Badge variant="secondary" className="mt-2 text-[10px]">
                              {r.language}
                            </Badge>
                          )}
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Github className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 font-medium">Analyze a GitHub profile</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Enter any public GitHub username above to see repos, followers, stars, top
                    languages, and the user's top projects.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUsername("pranaysriram");
                        setTimeout(() => handleAnalyze(), 0);
                      }}
                    >
                      Try pranaysriram
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          <aside>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analyzed profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stored.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No profiles analyzed yet.</p>
                ) : (
                  stored.map((p) => (
                    <div
                      key={p.username}
                      className={`flex items-center gap-3 rounded-md border p-2 transition-colors hover:bg-accent ${active?.username === p.username ? "bg-accent" : ""}`}
                    >
                      <button
                        className="flex flex-1 items-center gap-3 text-left"
                        onClick={() => setActive(p)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.avatar_url} alt={p.username} />
                          <AvatarFallback>{p.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.name || p.username}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            ⭐ {p.total_stars} · {p.followers} followers
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDelete(p.username)}
                        className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                        aria-label={`Remove ${p.username}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </aside>
        </div>
      </main>

      <footer className="mt-12 border-t">
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-xs text-muted-foreground">
          Made by{" "}
          <a
            href="https://github.com/pranaysriram"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            @pranaysriram
          </a>
        </div>
      </footer>
    </div>
  );
}
