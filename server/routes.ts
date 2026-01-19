import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

/**
 * Registers all API routes under the /api prefix.
 *
 * Vercel Cron Jobs:
 * - Configure `CRON_SECRET` env var.
 * - Vercel will send: `Authorization: Bearer $CRON_SECRET` when calling the cron path.
 */
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Health
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // InnerDreams (minimal MVP endpoint)
  // - `POST /api/innerdreams` runs a cycle (admin-triggered)
  // - `GET  /api/innerdreams` returns status
  // - `GET  /api/innerdreams/cron` runs a cycle (Vercel Cron)
  const innerdreamsPassword = process.env.INNERDREAMS_PASSWORD ?? "";
  const cronSecret = process.env.CRON_SECRET ?? "";

  const isAuthorized = (req: any, secret: string) => {
    const auth = req.header("authorization") ?? "";
    const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    const q = typeof req.query?.password === "string" ? req.query.password : "";
    return Boolean(secret) && (bearer === secret || q === secret);
  };

  app.get("/api/innerdreams", (req, res) => {
    if (!isAuthorized(req, innerdreamsPassword)) return res.status(401).json({ error: "unauthorized" });
    res.json({
      ok: true,
      mode: "manual-or-cron",
      hint: "POST /api/innerdreams to run one cycle. GET /api/innerdreams/cron is for Vercel cron only.",
    });
  });

  const runInnerDreamsCycle = async () => {
    // TODO: plug in OpenAI/GitHub automation here.
    // For now, we just record an activity timestamp.
    await storage.setMeta("innerdreams:lastRunAt", new Date().toISOString());
    return { ok: true, ranAt: await storage.getMeta("innerdreams:lastRunAt") };
  };

  app.post("/api/innerdreams", async (req, res) => {
    if (!isAuthorized(req, innerdreamsPassword)) return res.status(401).json({ error: "unauthorized" });
    try {
      const result = await runInnerDreamsCycle();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: "innerdreams_failed", detail: String(err?.message ?? err) });
    }
  });

  app.get("/api/innerdreams/cron", async (req, res) => {
    // Secured by CRON_SECRET (Authorization: Bearer ...)
    if (!isAuthorized(req, cronSecret)) return res.status(401).json({ error: "unauthorized" });
    try {
      const result = await runInnerDreamsCycle();
      res.json({ ...result, triggeredBy: "vercel-cron" });
    } catch (err: any) {
      res.status(500).json({ error: "innerdreams_failed", detail: String(err?.message ?? err) });
    }
  });

  return httpServer;
}
