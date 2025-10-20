/**
 * This script pushes the schema to the database
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

async function main() {
  console.log("Pushing schema to database...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  
  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  
  // Push the schema to the database
  console.log("Running migrations...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`); 
  
  try {
    console.log("Pushing schema changes...");
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log("Schema pushed successfully");
  } catch (error) {
    console.error("Error pushing schema:", error);
  }
  
  await client.end();
}

main().catch(console.error);