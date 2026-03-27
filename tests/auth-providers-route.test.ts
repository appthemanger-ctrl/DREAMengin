import { afterEach, describe, expect, it, vi } from "vitest";

async function importRouteWithEnv(
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    GOOGLE_OAUTH_UI_ENABLED?: boolean | null;
    GITHUB_OAUTH_UI_ENABLED?: boolean | null;
  },
) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/env", () => env);
  return import("../app/api/auth/providers/route");
}

describe("GET /api/auth/providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("@/lib/supabase/env");
  });

  it("returns unknown availability when Supabase env is missing", async () => {
    const { GET, UNKNOWN_OAUTH_PROVIDERS } = await importRouteWithEnv({
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
    });

    const response = await GET();

    expect(await response.json()).toEqual(UNKNOWN_OAUTH_PROVIDERS);
  });

  it("passes Supabase auth headers and preserves explicit provider booleans", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ external: { google: true, github: false } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await importRouteWithEnv({
      SUPABASE_URL: "https://dreamengin.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      GOOGLE_OAUTH_UI_ENABLED: true,
      GITHUB_OAUTH_UI_ENABLED: true,
    });

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://dreamengin.supabase.co/auth/v1/settings",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          apikey: "anon-key",
          Authorization: "Bearer anon-key",
        }),
      }),
    );
    expect(await response.json()).toEqual({ google: true, github: false });
  });

  it("fails closed when OAuth UI flags are not explicitly enabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ external: { google: true, github: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { GET } = await importRouteWithEnv({
      SUPABASE_URL: "https://dreamengin.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
      GOOGLE_OAUTH_UI_ENABLED: null,
      GITHUB_OAUTH_UI_ENABLED: null,
    });

    const response = await GET();

    expect(await response.json()).toEqual({ google: false, github: false });
  });

  it("returns unknown availability when the probe fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { GET, UNKNOWN_OAUTH_PROVIDERS } = await importRouteWithEnv({
      SUPABASE_URL: "https://dreamengin.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    });

    const response = await GET();

    expect(await response.json()).toEqual(UNKNOWN_OAUTH_PROVIDERS);
  });
});
