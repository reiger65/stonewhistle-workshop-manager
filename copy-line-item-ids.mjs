/**
 * Dit script kopieert Shopify line item IDs van de shopify_item_tracking tabel
 * naar de shopify_line_item_id kolom in de order_items tabel
 * 
 * Dit is een standalone script dat direct met de database werkt
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

// Database connectie
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Simpele schema definities alleen voor dit script
const schema = {
  orders: {
    id: { name: 'id' }
  },
  orderItems: {
    serialNumber: { name: 'serial_number' },
    shopifyLineItemId: { name: 'shopify_line_item_id' }
  }
};

// Verbinding met database opzetten
const db = drizzle(pool);

async function copyShopifyLineItemIds() {
  try {
    console.log('Start met kopiëren van Shopify line item IDs naar order_items...');

    // Gebruik rechtstreeks de Pool.query methode voor betere resultaten
    const result = await pool.query(
      'SELECT id, order_id, used_suffixes, item_mappings FROM shopify_item_tracking'
    );
    
    // Haal de rijen op uit het resultaat
    const trackingRecords = result.rows || [];
    console.log(`${trackingRecords.length} tracking items gevonden`);

    let updateCount = 0;
    let errorCount = 0;

    // Loop door alle tracking records
    for (const tracking of trackingRecords) {
      try {
        const orderId = tracking.order_id;
        
        // item_mappings is een JSONB datatype in PostgreSQL
        // Postgres geeft ons al het geparseerde object, geen string
        let itemMappings = tracking.item_mappings;
        
        // Debug: Laat zien wat voor type data we ontvangen
        console.log(`Order ${orderId}: item_mappings type = ${typeof itemMappings}, waarde:`, JSON.stringify(itemMappings));
        
        // Controleer of itemMappings een array is
        if (!Array.isArray(itemMappings)) {
          console.log(`Geen array voor mappings bij order ${orderId}`);
          continue;
        }
        
        console.log(`Order ${orderId}: Verwerken van ${itemMappings.length} mappings`);

        // Haal het orderNumber op voor deze order
        const orderResult = await pool.query(
          'SELECT order_number FROM orders WHERE id = $1',
          [orderId]
        );

        if (!orderResult.rows || !orderResult.rows.length) {
          console.log(`Kon geen order vinden met ID ${orderId}`);
          continue;
        }

        const orderNumber = orderResult.rows[0].order_number;
        
        // Update elk item in de mappings
        for (const mapping of itemMappings) {
          if (!mapping.shopifyLineItemId || !mapping.suffix) {
            console.log(`Overgeslagen mapping voor order ${orderId}: Ongeldige data`, mapping);
            continue;
          }
          
          // Zorg dat we het volledige serienummer gebruiken inclusief SW- prefix
          // Dit moet overeenkomen met wat in de database is opgeslagen
          const serialNumber = `SW-${orderNumber.replace(/^SW-/, '')}-${mapping.suffix}`;
          
          try {
            // Update het order_items record
            const updateResult = await pool.query(
              'UPDATE order_items SET shopify_line_item_id = $1 WHERE serial_number = $2 RETURNING id',
              [mapping.shopifyLineItemId, serialNumber]
            );

            if (updateResult.rows && updateResult.rows.length > 0) {
              console.log(`✅ Bijgewerkt: ${serialNumber} met ID ${mapping.shopifyLineItemId}`);
              updateCount++;
            } else {
              console.log(`⚠️ Geen item gevonden met serienummer ${serialNumber}`);
              errorCount++;
            }
          } catch (updateError) {
            console.error(`Fout bij updaten van item ${serialNumber}:`, updateError.message);
            errorCount++;
          }
        }
      } catch (innerError) {
        console.error(`Fout bij verwerken van tracking record voor order ${tracking.orderId}:`, innerError.message);
        errorCount++;
      }
    }

    console.log('----------------------------------------');
    console.log(`Script voltooid. ${updateCount} items bijgewerkt, ${errorCount} fouten aangetroffen.`);
    console.log('----------------------------------------');
  } catch (error) {
    console.error('ERROR bij uitvoeren script:', error.message);
  } finally {
    // Sluit de database connectie
    await pool.end();
  }
}

// Voer het script uit
copyShopifyLineItemIds();