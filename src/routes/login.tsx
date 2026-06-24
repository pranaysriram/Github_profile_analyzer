import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login, signInWithGoogle } from "@/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | GitHub Profile Analyzer" },
      { name: "description", content: "Login to GitHub Profile Analyzer." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your GitHub profile analyzer dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 flex w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            onClick={async () => {
              try {
                await signInWithGoogle();
                router.navigate({ to: "/" });
              } catch (err: any) {
                setError(err?.message ?? "Google sign-in failed");
              }
            }}
          >
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="mt-4 text-sm text-muted-foreground">
            Don’t have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-t-lg border-t border-border pt-4 text-sm text-muted-foreground">
            <Github className="h-4 w-4" />
            <span>GitHub Analyzer</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
