import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const scryptAsync = promisify(scrypt);

// Password hashing
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

// Extend session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Session setup - require SECRET in production
  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !sessionSecret) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  
  app.use(
    session({
      secret: sessionSecret || "dreamengin-dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // ============ AUTH ROUTES ============

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const signupSchema = z.object({
        email: z.string().email(),
        username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
        password: z.string().min(6),
      });

      const data = signupSchema.parse(req.body);

      // Check if user exists
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        username: data.username,
        password: hashedPassword,
      });

      // Create default widgets
      const defaultWidgets = [
        { userId: user.id, type: "mini_wall", position: 0, enabled: true },
        { userId: user.id, type: "music_player", position: 1, enabled: true },
        { userId: user.id, type: "games", position: 2, enabled: true },
        { userId: user.id, type: "friends", position: 3, enabled: true },
      ];

      for (const widget of defaultWidgets) {
        await storage.createWidget(widget);
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await comparePasswords(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============ USER ROUTES ============

  // Update current user
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { displayName, bio, avatarUrl, accentColor } = req.body;

      const user = await storage.updateUser(req.session.userId!, {
        displayName,
        bio,
        avatarUrl,
        accentColor,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Get user by username
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============ FEED ROUTES ============

  // Get feed items
  app.get("/api/feed", requireAuth, async (req, res) => {
    try {
      const items = await storage.getFeedItems(req.session.userId!);
      res.json(items);
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Failed to get feed" });
    }
  });

  // Create feed item
  app.post("/api/feed", requireAuth, async (req, res) => {
    try {
      const { type, title, content, mediaUrl, metadata } = req.body;

      const item = await storage.createFeedItem({
        userId: req.session.userId!,
        type: type || "post",
        title,
        content,
        mediaUrl,
        metadata,
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Create feed item error:", error);
      res.status(500).json({ error: "Failed to create feed item" });
    }
  });

  // ============ WIDGET ROUTES ============

  // Get widgets
  app.get("/api/widgets", requireAuth, async (req, res) => {
    try {
      const widgets = await storage.getWidgets(req.session.userId!);
      res.json(widgets);
    } catch (error) {
      console.error("Get widgets error:", error);
      res.status(500).json({ error: "Failed to get widgets" });
    }
  });

  // Create widget
  app.post("/api/widgets", requireAuth, async (req, res) => {
    try {
      const { type, position, enabled, config } = req.body;

      const widget = await storage.createWidget({
        userId: req.session.userId!,
        type,
        position: position || 0,
        enabled: enabled !== false,
        config,
      });

      res.status(201).json(widget);
    } catch (error) {
      console.error("Create widget error:", error);
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  // Update widget
  app.patch("/api/widgets/:id", requireAuth, async (req, res) => {
    try {
      const { enabled, position, config } = req.body;

      const widget = await storage.updateWidget(req.params.id, {
        enabled,
        position,
        config,
      });

      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }

      res.json(widget);
    } catch (error) {
      console.error("Update widget error:", error);
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  return httpServer;
}
