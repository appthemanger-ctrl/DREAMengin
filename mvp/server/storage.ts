import {
  type User,
  type InsertUser,
  type Profile,
  type Post,
  users,
  profiles,
  posts,
  follows,
  insertProfileSchema,
  insertPostSchema,
} from "@shared/schema";
import { randomUUID, scryptSync, timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "./db";

// Password hashing (no deps). Stored as: scrypt$<saltB64>$<hashB64>
function hashPassword(password: string) {
  const salt = randomUUID().replace(/-/g, "");
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${Buffer.from(salt, "utf8").toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(stored: string, provided: string) {
  try {
    const [alg, saltB64, hashB64] = String(stored).split("$");
    if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64").toString("utf8");
    const expected = Buffer.from(hashB64, "base64");
    const got = scryptSync(provided, salt, expected.length);
    return nodeTimingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(userId: string, data: unknown): Promise<Profile>;

  // Posts
  createPost(userId: string, data: unknown): Promise<Post>;
  listUserPosts(viewerId: string | null, username: string): Promise<Post[]>;
  listFeed(userId: string): Promise<Post[]>;

  // Follows
  follow(followerId: string, followeeId: string): Promise<void>;
  unfollow(followerId: string, followeeId: string): Promise<void>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  listFollowingIds(followerId: string): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<string, User>;
  private profilesMap: Map<string, Profile>;
  private postsList: Post[];
  private followsSet: Set<string>; // `${followerId}:${followeeId}`

  constructor() {
    this.usersMap = new Map();
    this.profilesMap = new Map();
    this.postsList = [];
    this.followsSet = new Set();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, username: insertUser.username, password: hashPassword(insertUser.password) };
    this.usersMap.set(id, user);
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    return this.profilesMap.get(userId);
  }

  async upsertProfile(userId: string, data: unknown): Promise<Profile> {
    const parsed = insertProfileSchema.parse(data ?? {});
    const current = this.profilesMap.get(userId);
    const next: Profile = {
      userId,
      displayName: parsed.displayName ?? current?.displayName ?? null,
      bio: parsed.bio ?? current?.bio ?? null,
      theme: parsed.theme ?? current?.theme ?? {},
      updatedAt: new Date(),
    };
    this.profilesMap.set(userId, next);
    return next;
  }

  async createPost(userId: string, data: unknown): Promise<Post> {
    const parsed = insertPostSchema.parse(data);
    const post: Post = {
      id: randomUUID(),
      userId,
      content: parsed.content,
      visibility: parsed.visibility,
      attachments: parsed.attachments ?? [],
      createdAt: new Date(),
    };
    this.postsList.unshift(post);
    return post;
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    return this.followsSet.has(`${followerId}:${followeeId}`);
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) return;
    this.followsSet.add(`${followerId}:${followeeId}`);
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    this.followsSet.delete(`${followerId}:${followeeId}`);
  }

  async listFollowingIds(followerId: string): Promise<string[]> {
    const out: string[] = [];
    for (const k of this.followsSet.values()) {
      const [f, t] = k.split(":");
      if (f === followerId && t) out.push(t);
    }
    return out;
  }

  async listUserPosts(viewerId: string | null, username: string): Promise<Post[]> {
    const user = await this.getUserByUsername(username);
    if (!user) return [];
    const isOwner = viewerId === user.id;
    const follows = viewerId ? await this.isFollowing(viewerId, user.id) : false;

    return this.postsList
      .filter((p) => p.userId === user.id)
      .filter((p) => {
        if (p.visibility === "public") return true;
        if (p.visibility === "followers") return isOwner || follows;
        return isOwner; // private
      });
  }

  async listFeed(userId: string): Promise<Post[]> {
    const following = await this.listFollowingIds(userId);
    const allowIds = new Set<string>([userId, ...following]);
    return this.postsList
      .filter((p) => allowIds.has(p.userId))
      .filter((p) => {
        if (p.userId === userId) return true;
        return p.visibility === "public" || p.visibility === "followers";
      })
      .slice(0, 100);
  }
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not configured");
    const password = hashPassword(insertUser.password);
    const rows = await db.insert(users).values({ username: insertUser.username, password }).returning();
    return rows[0];
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    if (!db) throw new Error("Database not configured");
    const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return rows[0];
  }

  async upsertProfile(userId: string, data: unknown): Promise<Profile> {
    if (!db) throw new Error("Database not configured");
    const parsed = insertProfileSchema.parse(data ?? {});
    // naive upsert: try update, else insert
    const existing = await this.getProfile(userId);
    if (existing) {
      const rows = await db
        .update(profiles)
        .set({
          displayName: parsed.displayName ?? existing.displayName,
          bio: parsed.bio ?? existing.bio,
          theme: (parsed.theme ?? existing.theme) as any,
          updatedAt: sql`now()`,
        })
        .where(eq(profiles.userId, userId))
        .returning();
      return rows[0];
    }

    const rows = await db
      .insert(profiles)
      .values({
        userId,
        displayName: parsed.displayName ?? null,
        bio: parsed.bio ?? null,
        theme: (parsed.theme ?? {}) as any,
      })
      .returning();
    return rows[0];
  }

  async createPost(userId: string, data: unknown): Promise<Post> {
    if (!db) throw new Error("Database not configured");
    const parsed = insertPostSchema.parse(data);
    const rows = await db
      .insert(posts)
      .values({
        userId,
        content: parsed.content,
        visibility: parsed.visibility,
        attachments: (parsed.attachments ?? []) as any,
      })
      .returning();
    return rows[0];
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    if (followerId === followeeId) return;
    // best-effort insert (ignore if already exists)
    await db
      .insert(follows)
      .values({ followerId, followeeId })
      .onConflictDoNothing();
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    if (!db) throw new Error("Database not configured");
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    if (!db) throw new Error("Database not configured");
    const rows = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)))
      .limit(1);
    return !!rows[0];
  }

  async listFollowingIds(followerId: string): Promise<string[]> {
    if (!db) throw new Error("Database not configured");
    const rows = await db
      .select({ followeeId: follows.followeeId })
      .from(follows)
      .where(eq(follows.followerId, followerId));
    return rows.map((r) => r.followeeId);
  }

  async listUserPosts(viewerId: string | null, username: string): Promise<Post[]> {
    if (!db) throw new Error("Database not configured");
    const user = await this.getUserByUsername(username);
    if (!user) return [];

    const isOwner = viewerId === user.id;
    const isFollower = viewerId ? await this.isFollowing(viewerId, user.id) : false;

    // visibility filter
    const allowVis: string[] = ["public"];
    if (isOwner) allowVis.push("followers", "private");
    else if (isFollower) allowVis.push("followers");

    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, user.id), inArray(posts.visibility as any, allowVis as any)))
      .orderBy(desc(posts.createdAt))
      .limit(100);
    return rows;
  }

  async listFeed(userId: string): Promise<Post[]> {
    if (!db) throw new Error("Database not configured");
    const following = await this.listFollowingIds(userId);
    const allowIds = [userId, ...following];

    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          inArray(posts.userId as any, allowIds as any),
          or(
            eq(posts.userId, userId),
            inArray(posts.visibility as any, ["public", "followers"] as any)
          )
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(100);

    return rows;
  }
}

export const storage: IStorage = db ? new DrizzleStorage() : new MemStorage();
