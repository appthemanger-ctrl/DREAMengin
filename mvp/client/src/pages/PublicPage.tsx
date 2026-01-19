import { useMemo } from "react";
import { useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublicUser = { id: string; username: string; createdAt: string };
type Profile = { displayName?: string; bio?: string; theme?: any };
type Post = { id: string; userId: string; content: string; visibility: "public" | "friends" | "private"; createdAt: string };

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

export default function PublicPage() {
  const [, params] = useRoute("/u/:username");
  const username = params?.username || "";
  const qc = useQueryClient();

  const userQ = useQuery({
    queryKey: ["publicUser", username],
    enabled: !!username,
    queryFn: () => getJSON<{ user: PublicUser; profile?: Profile }>(`/api/users/${encodeURIComponent(username)}`),
  });

  const postsQ = useQuery({
    queryKey: ["publicPosts", username],
    enabled: !!username,
    queryFn: () => getJSON<{ posts: Post[] }>(`/api/users/${encodeURIComponent(username)}/posts`),
  });

  const display = useMemo(() => {
    const profile = userQ.data?.profile;
    return profile?.displayName || userQ.data?.user.username || username;
  }, [userQ.data, username]);

  async function follow() {
    try {
      await postJSON(`/api/follow/${encodeURIComponent(username)}`, {});
      qc.invalidateQueries({ queryKey: ["feed"] });
      alert("Following");
    } catch (e: any) {
      alert(e?.message || "Could not follow");
    }
  }

  if (userQ.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (userQ.isError) {
    return <div className="min-h-screen flex items-center justify-center">User not found.</div>;
  }

  const bio = userQ.data?.profile?.bio;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{display}</CardTitle>
              <div className="text-sm text-muted-foreground">dreamengin.com/u/{username}</div>
            </div>
            <Button onClick={follow}>Follow</Button>
          </CardHeader>
          {bio ? <CardContent className="text-muted-foreground">{bio}</CardContent> : null}
        </Card>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Posts</div>
          {postsQ.isLoading ? (
            <div>Loading posts…</div>
          ) : postsQ.data?.posts?.length ? (
            postsQ.data.posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 whitespace-pre-wrap">{p.content}</CardContent>
              </Card>
            ))
          ) : (
            <div className="text-muted-foreground">No posts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
