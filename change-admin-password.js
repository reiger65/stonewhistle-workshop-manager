/**
 * Change admin user password
 */
import { createHash } from 'crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function changeAdminPassword() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Get new password from command line argument
  const newPassword = process.argv[2];
  
  if (!newPassword) {
    console.log('Usage: node change-admin-password.js <new-password>');
    console.log('Example: node change-admin-password.js MyNewPassword123');
    process.exit(1);
  }
  
  try {
    const hashedPassword = hashPassword(newPassword);
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedPassword, 'admin']
    );
    
    if (result.rowCount > 0) {
      console.log(`Admin password successfully changed to: ${newPassword}`);
    } else {
      console.log('Admin user not found. Creating new admin user...');
      await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        ['admin', hashedPassword]
      );
      console.log(`Admin user created with password: ${newPassword}`);
    }
  } catch (error) {
    console.error('Error changing admin password:', error);
  } finally {
    await pool.end();
  }
}

changeAdminPassword();