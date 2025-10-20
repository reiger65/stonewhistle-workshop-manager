import { pool } from './server/db.js';
// Fix for import error - use CJS syntax instead
// const { pool } = require('./server/db');
import fs from 'fs';

async function migrateRemoveLocation() {
  console.log('Starting migration to remove location field from mold inventory...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./remove-location-column.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateRemoveLocation();