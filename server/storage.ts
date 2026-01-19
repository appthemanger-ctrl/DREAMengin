import { type User, type InsertUser, users } from "@shared/schema";
import { randomUUID, scryptSync, timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
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
}

export class MemStorage implements IStorage {
  private usersMap: Map<string, User>;

  constructor() {
    this.usersMap = new Map();
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
}

export const storage: IStorage = db ? new DrizzleStorage() : new MemStorage();
