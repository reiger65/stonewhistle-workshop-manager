import { pool, db } from './server/db.js';
import * as schema from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function migrateMolds() {
  console.log('Starting mold migration to remove side field...');
  
  try {
    // Check if side column exists
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'mold_inventory' AND column_name = 'side';
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length > 0) {
      console.log('Side column exists - migrating data...');
      
      // Update mold names to include side information if needed
      await pool.query(`
        UPDATE mold_inventory
        SET name = CONCAT(name, ' (', side, ')')
        WHERE side NOT IN ('B', 'N/A');
      `);
      
      // Drop side column
      await pool.query(`
        ALTER TABLE mold_inventory
        DROP COLUMN side;
      `);
      
      console.log('Side column removed successfully.');
    } else {
      console.log('Side column does not exist - no migration needed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateMolds();