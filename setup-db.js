import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import * as schema from './drizzle/schema.ts';

// Create database connection
const sqlite = new Database('./prisma/dev.db');
const db = drizzle(sqlite, { schema });

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Create tables (this will be handled by drizzle-kit push)
    console.log('✅ Database setup complete');
    
    // Create a test admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    try {
      await db.insert(schema.users).values({
        username: 'admin',
        email: 'admin@stonewhistle.com',
        password_hash: hashedPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created (username: admin, password: admin)');
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw error;
      }
    }
    
    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    sqlite.close();
  }
}

setupDatabase();
