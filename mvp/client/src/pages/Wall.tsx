import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Me = { id: string; username: string };
type FeedPost = { id: string; username: string; content: string; createdAt: string; visibility: "public" | "friends" | "private" };

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data as T;
}

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

export default function Wall() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => getJSON<{ user: Me }>("/api/me"),
    retry: false,
  });

  const feedQ = useQuery({
    queryKey: ["feed"],
    queryFn: () => getJSON<{ posts: FeedPost[] }>("/api/feed"),
    retry: false,
    enabled: !meQ.isError,
  });

  const u = meQ.data?.user;
  const greeting = useMemo(() => (u ? `@${u.username}` : ""), [u]);

  async function submit() {
    if (!content.trim()) return;
    try {
      await postJSON("/api/posts", { content, visibility });
      setContent("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e: any) {
      alert(e?.message || "Could not post");
    }
  }

  function logout() {
    fetch("/api/logout", { method: "POST", credentials: "include" }).finally(() => setLocation("/"));
  }

  if (meQ.isLoading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (meQ.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setLocation("/login")}>Log in</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Mini Wall — {greeting}</div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setLocation(`/u/${u!.username}`)}>
              Public Page
            </Button>
            <Button variant="ghost" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Drop a thought…" />
            <div className="flex items-center justify-between gap-3">
              <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Followers</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={submit}>Share</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Feed</div>
          {feedQ.isLoading ? (
            <div>Loading feed…</div>
          ) : feedQ.data?.posts?.length ? (
            feedQ.data.posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-2">
                    @{p.username} · {new Date(p.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{p.content}</div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-muted-foreground">Nothing here yet. Follow someone or post something.</div>
          )}
        </div>
      </div>
    </div>
  );
}
