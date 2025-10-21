import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use DATABASE_URL from environment (Railway will provide this)
let databaseUrl = process.env.DATABASE_URL || 'postgresql://hanshoukes@localhost:5432/stonewhistle';

// Validate DATABASE_URL format
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set, using fallback for local development");
} else {
  // Check if DATABASE_URL is properly formatted
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🔗 Database URL parsed successfully: ${url.protocol}//${url.hostname}:${url.port}${url.pathname}`);
  } catch (error) {
    console.error("❌ Invalid DATABASE_URL format:", process.env.DATABASE_URL);
    console.error("Error:", error);
    
    // For Railway/production, don't use fallback - let it fail properly
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      console.error("❌ Invalid DATABASE_URL in production environment - deployment will fail");
      throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
    }
    
    // Only use fallback for local development
    databaseUrl = 'postgresql://hanshoukes@localhost:5432/stonewhistle';
    console.warn("⚠️  Using fallback database URL for local development");
  }
}

console.log(`🔗 Connecting to database: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

// Create pool with error handling
let pool: Pool;
try {
  pool = new Pool({ connectionString: databaseUrl });
} catch (error) {
  console.error("❌ Failed to create database pool:", error);
  throw new Error(`Database connection failed: ${error.message}`);
}

export { pool };
export const db = drizzle(pool, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1 as connected');
    console.log("✅ Database connection successful");
    return !!result.rows[0]?.connected;
  } catch (error) {
    console.error("❌ Database connection error:", error);
    return false;
  }
}

// Test database connection on startup (non-blocking)
setTimeout(async () => {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log("🚀 Database ready for connections");
    } else {
      console.warn("⚠️  Database connection failed - some features may not work");
    }
  } catch (error) {
    console.warn("⚠️  Database startup check failed:", error.message);
  }
}, 1000); // Wait 1 second before testing connection
