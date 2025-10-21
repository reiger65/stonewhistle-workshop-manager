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
  // Railway-specific connection configuration
  const poolConfig: any = {
    connectionString: databaseUrl,
    // Railway-optimized connection settings
    max: 5, // Reduced pool size for Railway
    idleTimeoutMillis: 20000, // Close idle clients after 20 seconds
    connectionTimeoutMillis: 20000, // Increased timeout for Railway
    statement_timeout: 60000, // Increased query timeout
    query_timeout: 60000, // Increased query timeout
    // SSL settings for Railway
    ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : false
  };

  // Add Railway-specific connection parameters
  if (process.env.RAILWAY_ENVIRONMENT) {
    poolConfig.keepAlive = true;
    poolConfig.keepAliveInitialDelayMillis = 10000;
    poolConfig.application_name = 'stonewhistle-workshop-manager';
  }

  pool = new Pool(poolConfig);
} catch (error) {
  console.error("❌ Failed to create database pool:", error);
  throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
}

export { pool };
export const db = drizzle(pool, { schema });

// Export a function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Use a longer timeout for Railway
    const timeoutMs = process.env.RAILWAY_ENVIRONMENT ? 30000 : 15000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
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
        console.warn("⚠️  Retrying connection in 15 seconds...");
        // Retry multiple times for Railway
        setTimeout(async () => {
          try {
            const retryConnected = await checkDatabaseConnection();
            if (retryConnected) {
              console.log("✅ Database connection successful on retry");
            } else {
              console.warn("⚠️  Database still not available after retry");
              console.warn("⚠️  Final retry in 30 seconds...");
              // Final retry for Railway
              setTimeout(async () => {
                try {
                  const finalRetryConnected = await checkDatabaseConnection();
                  if (finalRetryConnected) {
                    console.log("✅ Database connection successful on final retry");
                  } else {
                    console.warn("⚠️  Database connection failed after all retries - using memory storage");
                  }
                } catch (finalRetryError) {
                  console.warn("⚠️  Final database retry failed:", finalRetryError instanceof Error ? finalRetryError.message : String(finalRetryError));
                }
              }, 30000);
            }
          } catch (retryError) {
            console.warn("⚠️  Database retry failed:", retryError instanceof Error ? retryError.message : String(retryError));
          }
        }, 15000);
      }
    }
  } catch (error) {
    console.warn("⚠️  Database startup check failed:", error instanceof Error ? error.message : String(error));
  }
}, 2000); // Wait 2 seconds before testing connection
