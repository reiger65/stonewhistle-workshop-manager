/**
 * Dit script kopieert Shopify line item IDs van de shopify_item_tracking tabel
 * naar de shopify_line_item_id kolom in de order_items tabel
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Database setup
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL moet ingesteld zijn!");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function copyShopifyLineItemIds() {
  try {
    console.log('Start met kopiëren van Shopify line item IDs naar order_items...');

    // Haal alle item mappings op uit de shopify_item_tracking tabel
    const trackingItems = await db.query.shopifyItemTracking.findMany();
    console.log(`${trackingItems.length} tracking items gevonden`);

    let updateCount = 0;
    let errorCount = 0;

    // Voor elk tracking record, werk de bijbehorende order_items bij
    for (const tracking of trackingItems) {
      try {
        if (!tracking.itemMappings || !Array.isArray(tracking.itemMappings)) {
          console.log(`Overgeslagen tracking voor order ${tracking.orderId}: Geen geldige itemMappings`);
          continue;
        }

        for (const mapping of tracking.itemMappings) {
          if (!mapping.shopifyLineItemId || !mapping.suffix) {
            console.log(`Overgeslagen mapping in order ${tracking.orderId}: Ongeldige mapping data`, mapping);
            continue;
          }

          const orderNumber = await getOrderNumberById(tracking.orderId);
          if (!orderNumber) {
            console.log(`Kon orderNumber niet vinden voor orderId ${tracking.orderId}`);
            continue;
          }

          // Verwijder het "SW-" prefix als het aanwezig is
          const orderNumberWithoutPrefix = orderNumber.replace(/^SW-/, '');
          
          // Genereer het serienummer op basis van orderNumber (zonder SW prefix) en suffix
          const serialNumber = `${orderNumberWithoutPrefix}-${mapping.suffix}`;
          console.log(`Bijwerken van item ${serialNumber} met Shopify line item ID: ${mapping.shopifyLineItemId}`);

          // Update het order_items record met de shopify_line_item_id
          const updated = await db
            .update(schema.orderItems)
            .set({ shopifyLineItemId: mapping.shopifyLineItemId })
            .where(eq(schema.orderItems.serialNumber, serialNumber))
            .returning();

          if (updated && updated.length > 0) {
            console.log(`✅ Bijgewerkt: ${serialNumber} met ID ${mapping.shopifyLineItemId}`);
            updateCount++;
          } else {
            console.log(`⚠️ Geen item gevonden met serienummer ${serialNumber}`);
            errorCount++;
          }
        }
      } catch (innerError) {
        console.error(`Fout bij verwerken van tracking record voor order ${tracking.orderId}:`, innerError);
        errorCount++;
      }
    }

    console.log('----------------------------------------');
    console.log(`Script voltooid. ${updateCount} items bijgewerkt, ${errorCount} fouten aangetroffen.`);
    console.log('----------------------------------------');
  } catch (error) {
    console.error('ERROR bij uitvoeren script:', error);
  } finally {
    // Sluit de database connectie
    await pool.end();
  }
}

// Helper functie om orderNumber op te halen op basis van orderId
async function getOrderNumberById(orderId) {
  const result = await db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
    columns: { orderNumber: true }
  });
  return result?.orderNumber;
}

// Voer het script uit
copyShopifyLineItemIds();