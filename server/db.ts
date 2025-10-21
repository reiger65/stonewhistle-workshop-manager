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
    
    // For Railway, try to use the DATABASE_URL anyway (it might work despite validation)
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.warn("⚠️  Railway environment detected - using DATABASE_URL despite validation error");
      // Keep the original DATABASE_URL for Railway
    } else {
      // Use fallback for local development only
      databaseUrl = 'postgresql://hanshoukes@localhost:5432/stonewhistle';
      console.warn("⚠️  Using fallback database URL for local development");
    }
  }
}

console.log(`🔗 Connecting to database: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

// Create pool with error handling and Railway-optimized settings
let pool: InstanceType<typeof Pool>;
try {
  pool = new Pool({ 
    connectionString: databaseUrl,
    // Railway-optimized connection settings
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
    statement_timeout: 30000, // Cancel query after 30 seconds
    query_timeout: 30000, // Cancel query after 30 seconds
    // SSL settings for Railway
    ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : false
  });
} catch (error) {
  console.error("❌ Failed to create database pool:", error);
  throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
}

export { pool };
export const db = drizzle(pool, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Use a timeout for the connection test
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 15000);
    });
    
    const queryPromise = pool.query('SELECT 1 as connected');
    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    
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
    console.log("🔍 Testing database connection...");
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log("🚀 Database ready for connections");
    } else {
      console.warn("⚠️  Database connection failed - some features may not work");
      if (process.env.RAILWAY_ENVIRONMENT) {
        console.warn("⚠️  Railway environment detected - database may be starting up");
        console.warn("⚠️  Retrying connection in 10 seconds...");
        // Retry once more for Railway
        setTimeout(async () => {
          try {
            const retryConnected = await checkDatabaseConnection();
            if (retryConnected) {
              console.log("✅ Database connection successful on retry");
            } else {
              console.warn("⚠️  Database still not available after retry");
            }
          } catch (retryError) {
            console.warn("⚠️  Database retry failed:", retryError instanceof Error ? retryError.message : String(retryError));
          }
        }, 10000);
      }
    }
  } catch (error) {
    console.warn("⚠️  Database startup check failed:", error instanceof Error ? error.message : String(error));
  }
}, 2000); // Wait 2 seconds before testing connection
