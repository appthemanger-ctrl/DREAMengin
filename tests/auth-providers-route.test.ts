import { afterEach, describe, expect, it, vi } from "vitest";

async function importRouteWithEnv(env: { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string }) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/config", () => ({
    ...env,
    SUPABASE_CONFIG: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_PUBLISHABLE_KEY,
      setupHint: "test",
      isConfigured: () => Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY),
    },
  }));
  return import("../app/api/auth/providers/route");
}

describe("GET /api/auth/providers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("@/lib/supabase/config");
  });

  it("returns unknown availability when Supabase env is missing", async () => {
    const { GET, UNKNOWN_OAUTH_PROVIDERS } = await importRouteWithEnv({
      SUPABASE_URL: "",
      SUPABASE_PUBLISHABLE_KEY: "",
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
      SUPABASE_URL: "https://example.test",
      SUPABASE_PUBLISHABLE_KEY: "anon-key",
    });

    const response = await GET();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/auth/v1/settings",
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

  it("returns unknown availability when the probe fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { GET, UNKNOWN_OAUTH_PROVIDERS } = await importRouteWithEnv({
      SUPABASE_URL: "https://example.test",
      SUPABASE_PUBLISHABLE_KEY: "anon-key",
    });

    const response = await GET();

    expect(await response.json()).toEqual(UNKNOWN_OAUTH_PROVIDERS);
  });
});
