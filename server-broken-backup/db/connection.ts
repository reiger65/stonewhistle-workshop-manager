import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema.js';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_0N5LBzjbwICa@ep-gentle-shadow-a66g9uoh.us-west-2.aws.neon.tech/neondb?sslmode=require';
const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });

// Test database connection
export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
