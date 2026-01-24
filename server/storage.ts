import { 
  users, 
  profiles,
  feedItems, 
  widgets, 
  friends,
  savedItems,
  type User, 
  type InsertUser,
  type FeedItem,
  type Widget,
  type Profile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Storage interface for all CRUD operations
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Feed Items
  getFeedItems(userId: string): Promise<FeedItem[]>;
  createFeedItem(item: Partial<FeedItem>): Promise<FeedItem>;

  // Widgets
  getWidgets(userId: string): Promise<Widget[]>;
  createWidget(widget: Partial<Widget>): Promise<Widget>;
  updateWidget(id: string, data: Partial<Widget>): Promise<Widget | undefined>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: Partial<Profile>): Promise<Profile>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Feed Items
  async getFeedItems(userId: string): Promise<FeedItem[]> {
    return await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.userId, userId))
      .orderBy(desc(feedItems.createdAt));
  }

  async createFeedItem(item: Partial<FeedItem>): Promise<FeedItem> {
    const [feedItem] = await db
      .insert(feedItems)
      .values(item as any)
      .returning();
    return feedItem;
  }

  // Widgets
  async getWidgets(userId: string): Promise<Widget[]> {
    return await db
      .select()
      .from(widgets)
      .where(eq(widgets.userId, userId))
      .orderBy(widgets.position);
  }

  async createWidget(widget: Partial<Widget>): Promise<Widget> {
    const [newWidget] = await db
      .insert(widgets)
      .values(widget as any)
      .returning();
    return newWidget;
  }

  async updateWidget(id: string, data: Partial<Widget>): Promise<Widget | undefined> {
    const [widget] = await db
      .update(widgets)
      .set(data)
      .where(eq(widgets.id, id))
      .returning();
    return widget || undefined;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const [newProfile] = await db
      .insert(profiles)
      .values(profile as any)
      .returning();
    return newProfile;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set(data)
      .where(eq(profiles.userId, userId))
      .returning();
    return profile || undefined;
  }
}

export const storage = new DatabaseStorage();
