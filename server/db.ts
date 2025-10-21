import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For local development, use a fallback DATABASE_URL if not set
const databaseUrl = process.env.DATABASE_URL || 'postgresql://hanshoukes@localhost:5432/stonewhistle';

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set, using fallback for local development");
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1 as connected');
    return !!result.rows[0]?.connected;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
