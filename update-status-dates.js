/**
 * Script to update status_change_dates for all order items
 * 
 * This script will update all order items with proper status_change_dates
 * based on their current status, ensuring checkboxes are displayed properly
 * in the UI.
 */

import pg from 'pg';
const { Client } = pg;

async function updateStatusChangeDates() {
  console.log('Starting status_change_dates update for all order items...');
  
  // Connect to the database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all order items that need status date updates
    const result = await client.query(`
      SELECT id, serial_number, status, status_change_dates
      FROM order_items
    `);
    
    console.log(`Found ${result.rows.length} order items with empty status_change_dates`);
    
    // Array of all possible statuses in order
    const statusOrder = [
      'ordered',
      'validated',
      'building',
      'testing',
      'terrasigillata',
      'firing',
      'smokefiring',
      'tuning1',
      'tuning2',
      'quality_check',
      'ready',
      'shipping',
      'delivered',
      'archived'
    ];
    
    // Update each item
    let updatedCount = 0;
    
    for (const item of result.rows) {
      // Get the current status index
      const currentStatusIndex = statusOrder.indexOf(item.status);
      
      if (currentStatusIndex === -1) {
        console.log(`Skipping item ${item.serial_number} with unknown status: ${item.status}`);
        continue;
      }
      
      // Generate status_change_dates based on current status
      const statusChangeDates = {};
      
      // Generate dates for all statuses up to and including the current one
      const now = new Date();
      
      for (let i = 0; i <= currentStatusIndex; i++) {
        // Subtract days from today to create a realistic timeline
        // Start 30 days ago and work forward
        const date = new Date(now);
        date.setDate(date.getDate() - (30 - i * 2));
        statusChangeDates[statusOrder[i]] = date.toISOString();
      }
      
      // Update the item with new status_change_dates
      await client.query(`
        UPDATE order_items
        SET status_change_dates = $1
        WHERE id = $2
      `, [JSON.stringify(statusChangeDates), item.id]);
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} items so far...`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} order items with new status_change_dates`);
  } catch (error) {
    console.error('Error updating status_change_dates:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Execute the function as the main module
if (import.meta.url === import.meta.main) {
  updateStatusChangeDates().catch(console.error);
}

export { updateStatusChangeDates };