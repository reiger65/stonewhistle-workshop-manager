import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use DATABASE_URL from environment (Railway will provide this)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://hanshoukes@localhost:5432/stonewhistle';

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set, using fallback for local development");
}

console.log(`🔗 Connecting to database: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

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
