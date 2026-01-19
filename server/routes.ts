import type { Express } from "express";
import type { Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";

type SessionPayload = { uid: string; username: string; role: "admin" | "user"; exp: number };

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(payload: SessionPayload, secret: string) {
  const body = base64url(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64url(mac)}`;
}

function verify(token: string, secret: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const mac = base64url(crypto.createHmac("sha256", secret).update(body).digest());
  if (mac !== sig) return null;
  const payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as SessionPayload;
  if (!payload?.exp || Date.now() > payload.exp) return null;
  return payload;
}

function getCookie(req: any, name: string): string | null {
  const header = req.headers?.cookie;
  if (!header) return null;
  const parts = header.split(";").map((p: string) => p.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function setCookie(res: any, name: string, value: string, opts: { maxAgeSec?: number; httpOnly?: boolean } = {}) {
  const maxAge = opts.maxAgeSec ?? 60 * 60 * 24 * 7;
  const httpOnly = opts.httpOnly ?? true;
  const pieces = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAge}`,
    `SameSite=Lax`,
    `Secure`,
  ];
  if (httpOnly) pieces.push("HttpOnly");
  res.setHeader("Set-Cookie", pieces.join("; "));
}

function clearCookie(res: any, name: string) {
  res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`);
}

const SESSION_COOKIE = "dreamengin_session";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Health
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Auth: master key unlock -> admin session.
  app.post("/api/auth/admin-key", async (req, res) => {
    const provided = String(req.body?.key || "");
    const expected = process.env.DREAMENGIN_MASTER_KEY || process.env.INNERDREAMS_PASSWORD || "";
    if (!expected) return res.status(500).json({ error: "Server missing DREAMENGIN_MASTER_KEY (or INNERDREAMS_PASSWORD)." });
    if (!provided || provided !== expected) return res.status(401).json({ error: "Invalid key" });

    // Ensure an admin user exists.
    let user = await storage.getUserByUsername("admin");
    if (!user) {
      user = await storage.createUser({ username: "admin", password: "local" } as any);
    }

    const secret = process.env.AUTH_SECRET || expected;
    const payload: SessionPayload = {
      uid: user.id,
      username: user.username,
      role: "admin",
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
    const token = sign(payload, secret);
    setCookie(res, SESSION_COOKIE, token);
    return res.json({ ok: true, user: { id: user.id, username: user.username, role: "admin" } });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = getCookie(req, SESSION_COOKIE);
    if (!token) return res.status(401).json({ error: "not_authenticated" });
    const secret = process.env.AUTH_SECRET || process.env.DREAMENGIN_MASTER_KEY || process.env.INNERDREAMS_PASSWORD || "dev";
    const payload = verify(token, secret);
    if (!payload) return res.status(401).json({ error: "not_authenticated" });
    return res.json({ user: { id: payload.uid, username: payload.username, role: payload.role } });
  });

  app.post("/api/auth/logout", async (_req, res) => {
    clearCookie(res, SESSION_COOKIE);
    return res.json({ ok: true });
  });

  // InnerDreams: minimal API contract used by the UI module.
  app.post("/api/innerdreams", async (req, res) => {
    const { action, password, instruction } = req.body || {};
    const expected = process.env.INNERDREAMS_PASSWORD || process.env.DREAMENGIN_MASTER_KEY;
    if (!expected) return res.status(500).json({ ok: false, error: "Server missing INNERDREAMS_PASSWORD." });
    if (password !== expected) return res.status(401).json({ ok: false, error: "Auth failed." });

    if (action === "status") {
      return res.json({ ok: true, status: "ready", mode: "manual", note: "InnerDreams endpoint live. Add OPENAI_API_KEY to enable AI actions." });
    }

    if (action === "edit") {
      // Placeholder: wire OpenAI/GitHub here later.
      return res.json({
        ok: true,
        result: "received",
        instruction: String(instruction || ""),
        note: "AI/GitHub automation not enabled in this build. Set OPENAI_API_KEY + GITHUB_TOKEN and extend server/routes.ts.",
      });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  });

  return httpServer;
}
