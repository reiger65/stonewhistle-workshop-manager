import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
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