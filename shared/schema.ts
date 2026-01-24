import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  accentColor: text("accent_color").default("#f97316"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles for extended info
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  robloxUsername: text("roblox_username"),
  spotifyConnected: boolean("spotify_connected").default(false),
  discordConnected: boolean("discord_connected").default(false),
  twitchConnected: boolean("twitch_connected").default(false),
  youtubeConnected: boolean("youtube_connected").default(false),
});

// Feed items (Mini Wall posts, etc.)
export const feedItems = pgTable("feed_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("post"), // post, music, game, link
  title: text("title"),
  content: text("content"),
  mediaUrl: text("media_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Widget instances for user dashboard
export const widgets = pgTable("widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // music_player, games, store, friends, clock, weather
  enabled: boolean("enabled").default(true),
  position: integer("position").default(0),
  config: jsonb("config"),
});

// Friends system
export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, accepted
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved items (bookmarks)
export const savedItems = pgTable("saved_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  feedItemId: varchar("feed_item_id").references(() => feedItems.id),
  externalUrl: text("external_url"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  feedItems: many(feedItems),
  widgets: many(widgets),
  friends: many(friends),
  savedItems: many(savedItems),
}));

export const feedItemsRelations = relations(feedItems, ({ one }) => ({
  user: one(users, { fields: [feedItems.userId], references: [users.id] }),
}));

export const widgetsRelations = relations(widgets, ({ one }) => ({
  user: one(users, { fields: [widgets.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  accentColor: true,
});

export const insertFeedItemSchema = createInsertSchema(feedItems).pick({
  userId: true,
  type: true,
  title: true,
  content: true,
  mediaUrl: true,
  metadata: true,
});

export const insertWidgetSchema = createInsertSchema(widgets).pick({
  userId: true,
  type: true,
  enabled: true,
  position: true,
  config: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type FeedItem = typeof feedItems.$inferSelect;
export type Widget = typeof widgets.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type SavedItem = typeof savedItems.$inferSelect;
