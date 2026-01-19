import type { Express, Request, Response } from "express";
import { insertUserSchema } from "@shared/schema";
import { storage, hashPassword, verifyPassword } from "./storage";

type SessionUser = { id: string; username: string };

function getSessionUser(req: Request): SessionUser | null {
  const u = (req.session as any)?.user as SessionUser | undefined;
  return u ?? null;
}

function setSessionUser(req: Request, user: SessionUser | null) {
  (req.session as any).user = user ?? null;
}

export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/auth/me", (req, res) => {
    const user = getSessionUser(req);
    res.json({ user });
  });

  app.post("/api/auth/logout", (req, res) => {
    setSessionUser(req, null);
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.post("/api/auth/signup", async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).send(parsed.error.message);

    const { username, password } = parsed.data;
    const existing = await storage.getUserByUsername(username);
    if (existing) return res.status(409).send("Username already exists");

    const user = await storage.createUser({ username, password: hashPassword(password) });
    setSessionUser(req, { id: user.id, username: user.username });
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
    if (!username || !password) return res.status(400).send("Missing username or password");

    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(401).send("Invalid credentials");
    if (!verifyPassword(password, user.password)) return res.status(401).send("Invalid credentials");

    setSessionUser(req, { id: user.id, username: user.username });
    res.json({ ok: true, user: { id: user.id, username: user.username } });
  });

  app.post("/api/admin-login", async (req, res) => {
    const key = String((req.body ?? {}).key ?? "");
    const expected = process.env.ADMIN_KEY || "";
    if (!expected) return res.status(500).send("ADMIN_KEY not set");
    if (!key || key !== expected) return res.status(401).send("Invalid key");

    // Ensure admin user exists
    let admin = await storage.getUserByUsername("owner");
    if (!admin) {
      admin = await storage.createUser({ username: "owner", password: hashPassword("change-me") });
    }

    setSessionUser(req, { id: admin.id, username: admin.username });
    res.json({ ok: true, user: { id: admin.id, username: admin.username } });
  });

  app.get("/api/profiles/:username", async (req: Request, res: Response) => {
    const username = String(req.params.username || "");
    const u = await storage.getUserByUsername(username);
    if (!u) return res.status(404).send("Not found");
    res.json({ user: { id: u.id, username: u.username } });
  });
}
