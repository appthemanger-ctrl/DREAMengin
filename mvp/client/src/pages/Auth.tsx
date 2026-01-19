import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "register";

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLoc] = useLocation();

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create your Dream Home"), [mode]);

  async function submit() {
    setLoading(true);
    try {
      if (mode === "login") {
        await postJSON("/api/auth/login", { username, password });
      } else {
        await postJSON("/api/auth/register", { username, password });
      }
      setLoc("/home");
    } catch (e: any) {
      alert(e?.message || "Something broke");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Log in to your private Dream Home."
              : "Pick a username — this becomes your public Dream Page URL."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="apple" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button className="w-full" onClick={submit} disabled={loading || !username || !password}>
            {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
          </Button>

          <div className="text-sm text-muted-foreground flex items-center justify-between">
            <span>{mode === "login" ? "New here?" : "Already have an account?"}</span>
            <Button
              variant="link"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="px-0"
            >
              {mode === "login" ? "Create one" : "Log in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
