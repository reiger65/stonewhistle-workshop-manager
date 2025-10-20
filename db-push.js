/**
 * Push schema to database directly
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema';

async function main() {
  console.log("Pushing schema to database...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  
  try {
    console.log("Pushing schema directly to database...");
    // Push schema to database
    await db.push(schema);
    console.log("Schema pushed successfully");
  } catch (error) {
    console.error("Error pushing schema:", error);
  }
  
  await client.end();
}

main().catch(console.error);