import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export const pool: Pool | null = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    })
  : null;

// Note: If DATABASE_URL is missing, db will be null and the app will fall back to in-memory storage.
export const db = pool ? drizzle(pool, { schema }) : null;
