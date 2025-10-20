/**
 * Script om dubbele items in problematische orders te corrigeren
 * Dit script markeert alle dubbele items (met dezelfde shopifyLineItemId) als gearchiveerd
 * 
 * Dit script moet worden uitgevoerd met:
 * node -r tsx/register fix-duplicate-items.js
 */

// Importeer de typen en functies uit TypeScript
import { pool, db } from './server/db';
import { checkAndCleanupDuplicateItems } from './server/shopify';
import { DatabaseStorage } from './server/database-storage';

async function fixDuplicateItems() {
  console.log('🧹 STARTEN OPRUIMEN DUBBELE ITEMS');
  
  try {
    const storage = new DatabaseStorage();
    
    // Lijst met problematische order nummers
    const problemOrderNumbers = ['1555', '1559', '1560', '1542'];
    
    // Zoek de order IDs op basis van de order nummers
    for (const orderNumber of problemOrderNumbers) {
      console.log(`\nVerwerken van order ${orderNumber}...`);
      
      // Haal order op op basis van ordernummer
      const order = await storage.getOrderByOrderNumber(`SW-${orderNumber}`);
      
      if (!order) {
        console.log(`⚠️ Order ${orderNumber} niet gevonden!`);
        continue;
      }
      
      console.log(`Order ${orderNumber} gevonden met ID ${order.id}`);
      
      // Haal alle items op voor deze order
      const items = await storage.getOrderItems(order.id);
      console.log(`Order ${orderNumber} heeft ${items.length} items`);
      
      // Gebruik de cleanup functie om dubbele items te markeren als gearchiveerd
      await checkAndCleanupDuplicateItems(order.id, items);
      
      // Haal items opnieuw op om te verifiëren hoeveel er nu actief zijn
      const updatedItems = await storage.getOrderItems(order.id);
      const activeItems = updatedItems.filter(item => !item.isArchived);
      
      console.log(`Order ${orderNumber} heeft nu ${activeItems.length} actieve items van de ${updatedItems.length} totaal`);
    }
  } catch (error) {
    console.error('Error fixing duplicate items:', error);
  } finally {
    // Sluit de database verbinding
    await pool.end();
    console.log('\n✅ KLAAR!');
  }
}

// Voer het script uit
fixDuplicateItems().catch(error => {
  console.error('Error in fixDuplicateItems:', error);
  process.exit(1);
});