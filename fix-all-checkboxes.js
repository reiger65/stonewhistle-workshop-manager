/**
 * Script to update status_change_dates for ALL order items
 * 
 * This script will update all order items with proper status_change_dates
 * based on reasonable production flow, ensuring checkboxes are displayed properly
 * in the UI.
 */

import pg from 'pg';
const { Client } = pg;

async function updateAllCheckboxes() {
  console.log('Starting complete status_change_dates update for ALL order items...');
  
  // Connect to the database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Get all order items
    const result = await client.query(`
      SELECT id, serial_number, status
      FROM order_items
    `);
    
    console.log(`Found ${result.rows.length} order items to update`);
    
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
    const now = new Date();
    
    for (const item of result.rows) {
      // Get the current status index - default to 'ordered' if no valid status
      const currentStatus = item.status || 'ordered';
      const currentStatusIndex = statusOrder.indexOf(currentStatus);
      
      if (currentStatusIndex === -1) {
        console.log(`Skipping item ${item.serial_number} with unknown status: ${currentStatus}`);
        continue;
      }
      
      // Generate status_change_dates based on production flow
      const statusChangeDates = {};
      
      // Determine how far back to start the timeline based on item number
      // Extract numeric portion of serial number, falling back to item ID if not available
      let itemNumber = 0;
      if (item.serial_number) {
        const serialParts = item.serial_number.split('-');
        if (serialParts.length >= 1) {
          itemNumber = parseInt(serialParts[0], 10) || item.id;
        }
      } else {
        itemNumber = item.id;
      }
      
      // Start date - later items have more recent start dates
      // Use current year and month, with day based on item number (newer items start later)
      const startDate = new Date(now);
      // Subtract days based on item number - older items started earlier
      // Items with higher numbers started more recently
      const dayOffset = Math.min(60, Math.max(0, 60 - (itemNumber % 100)));
      startDate.setDate(startDate.getDate() - dayOffset);
      
      // Generate dates for all statuses up to and including the current one
      // Space them out at reasonable intervals
      for (let i = 0; i <= currentStatusIndex; i++) {
        const date = new Date(startDate);
        // Add a few days for each step in the process
        date.setDate(date.getDate() + (i * 3));
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

// Execute the function 
updateAllCheckboxes().catch(console.error);