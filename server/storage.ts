import { randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { InsertUser, User } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export function hashPassword(password: string): string {
  const salt = randomUUID().replace(/-/g, "");
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const expected = Buffer.from(parts[2], "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const u = Array.from(this.users.values()).find((x) => x.username === username);
    return u;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, username: insertUser.username, password: insertUser.password };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
