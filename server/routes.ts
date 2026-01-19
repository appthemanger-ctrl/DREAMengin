import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage, verifyPassword } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { innerdreamsHandler } from "./innerdreams";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    user?: { id: string; username: string; role: "user" | "admin" };
    adminUnlocked?: boolean; // unlocks the "Admin" button in UI
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });
  next();
}
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.set("trust proxy", 1);

    const sessionOptions: session.SessionOptions = {
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
      },
    };

  if (pool) {
    sessionOptions.store = new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    });
  }

  app.use(session(sessionOptions));

  // Health
  app.get("/api/health", (_req, res) => {
    res.status(200).setHeader("content-type", "text/plain").send("ok\n");
  });

  // Public session info
  app.get("/api/auth/me", (req, res) => {
    res.json({ user: req.session.user || null, adminUnlocked: !!req.session.adminUnlocked });
  });

  // Register/Login/Logout
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body || {});
      const existing = await storage.getUserByUsername(parsed.username);
      if (existing) return res.status(409).json({ error: "Username already taken" });
      const user = await storage.createUser(parsed);
      req.session.user = { id: user.id, username: user.username, role: "user" };
      res.json({ ok: true, user: req.session.user });
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Invalid input" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username = "", password = "" } = req.body || {};
    const user = await storage.getUserByUsername(String(username));
    if (!user || !verifyPassword(user.password, String(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.user = { id: user.id, username: user.username, role: "user" };
    res.json({ ok: true, user: req.session.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  // Admin unlock (Landing modal). Unlocks "Admin Panel" button in UI.
  app.post("/api/admin-login", async (req, res) => {
    const expected = process.env.ADMIN_UNLOCK_KEY || process.env.INNERDREAMS_PASSWORD || "";
    const key = String((req.body || {}).key || "");
    if (!expected) return res.status(500).json({ error: "Admin key not configured" });
    // constant time compare
    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    const len = Math.max(a.length, b.length);
    let diff = a.length ^ b.length;
    for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
    if (diff !== 0) return res.status(401).json({ error: "Invalid key" });

    req.session.adminUnlocked = true;
    // create/update admin session identity
    req.session.user = { id: "admin", username: "Admin", role: "admin" };
    return res.json({ ok: true, user: req.session.user });
  });

  // Innerdreams (AI site updater) - admin only AND requires INNERDREAMS_PASSWORD in body
  app.all("/api/innerdreams", requireAdmin, innerdreamsHandler);

  return httpServer;
}
