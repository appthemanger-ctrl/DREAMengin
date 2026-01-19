import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ---------------------------
// Social + Profile (MVP)
// ---------------------------

// User-facing profile settings. Keep it flexible (json) while you're iterating.
export const profiles = pgTable("profiles", {
  userId: varchar("user_id").notNull().primaryKey(),
  displayName: text("display_name"),
  bio: text("bio"),
  theme: jsonb("theme").$type<Record<string, any>>().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const insertProfileSchema = z
  .object({
    displayName: z.string().max(80).optional(),
    bio: z.string().max(280).optional(),
    theme: z.record(z.any()).optional(),
  })
  .strict();

export type Profile = typeof profiles.$inferSelect;

// Posts that power the Mini Wall (your slow, curated feed).
export const posts = pgTable("posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  // public = anyone; followers = people who follow you; private = only you
  visibility: text("visibility").notNull().default("public"),
  // optional: later you can attach media refs stored in user cloud
  attachments: jsonb("attachments").$type<any[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const insertPostSchema = z
  .object({
    content: z.string().min(1).max(2000),
    visibility: z.enum(["public", "followers", "private"]).default("public"),
    attachments: z.array(z.any()).optional(),
  })
  .strict();

export type Post = typeof posts.$inferSelect;

// Simple follow graph ("friends" can evolve later; start with follow).
export const follows = pgTable("follows", {
  followerId: varchar("follower_id").notNull(),
  followeeId: varchar("followee_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Follow = typeof follows.$inferSelect;

// App State Schema
export const moduleIds = [
  "compose",
  "notifications",
  "feed",
  "page",
  "messages",
  "customize",
  "settings",
  "ai_architect"
] as const;

export type ModuleId = (typeof moduleIds)[number];

export const windowStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  open: z.boolean(),
  minimized: z.boolean(),
});

export type WindowState = z.infer<typeof windowStateSchema>;

export const appStateSchema = z.object({
  focus: z.boolean(),
  windows: z.record(windowStateSchema),
  notifications: z.record(z.number()),
  drops: z.array(z.any()).optional(), // Add this to match usage
});

export type AppState = z.infer<typeof appStateSchema>;

export const DEFAULT_STATE: AppState = {
  focus: false,
  windows: {
    compose: { x: 100, y: 100, w: 400, h: 500, z: 1, open: false, minimized: false },
    notifications: { x: 150, y: 150, w: 350, h: 600, z: 2, open: false, minimized: false },
    feed: { x: 200, y: 100, w: 500, h: 700, z: 3, open: false, minimized: false },
    page: { x: 250, y: 150, w: 800, h: 600, z: 4, open: false, minimized: false },
    messages: { x: 300, y: 200, w: 350, h: 500, z: 5, open: false, minimized: false },
    customize: { x: 350, y: 150, w: 400, h: 600, z: 6, open: false, minimized: false },
    settings: { x: 400, y: 200, w: 600, h: 500, z: 7, open: false, minimized: false },
    ai_architect: { x: 450, y: 100, w: 600, h: 450, z: 8, open: false, minimized: false },
  },
  notifications: {},
  drops: [],
};
