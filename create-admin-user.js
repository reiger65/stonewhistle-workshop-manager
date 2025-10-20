/**
 * Create admin user with proper password hashing
 */
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const hashedPassword = await hashPassword('admin');
    
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', hashedPassword]
    );
    
    console.log('Admin user created successfully with username: admin, password: admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();