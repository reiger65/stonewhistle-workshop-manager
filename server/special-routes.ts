/**
 * Special routes for order synchronization issues
 */
import express from 'express';
import { syncSpecificOrder } from './order-sync';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Functie om orders te archiveren (voor orders die in Shopify zijn gearchiveerd)
async function archiveOrder(orderNumber: string) {
  try {
    console.log(`⚙️ Archiveren van order ${orderNumber} gestart...`);
    
    // Haal de order op
    const order = await storage.getOrderByOrderNumber(orderNumber);
    if (!order) {
      console.log(`❌ Order ${orderNumber} niet gevonden`);
      return { success: false, message: `Order ${orderNumber} niet gevonden` };
    }
    
    // Update de orderstatus naar archived
    // Alleen status wijzigen, geen notes toevoegen om het commentaarveld schoon te houden
    await storage.updateOrder(order.id, {
      status: 'archived'
    });
    
    // Archiveer alle items van deze order
    const orderItems = await storage.getOrderItems(order.id);
    let archivedItemCount = 0;
    
    for (const item of orderItems) {
      if (!item.isArchived) {
        await storage.updateOrderItem(item.id, {
          isArchived: true,
          archivedReason: 'Order automatisch gearchiveerd vanwege synchronisatie met Shopify',
          status: 'archived'
        });
        archivedItemCount++;
      }
    }
    
    console.log(`✅ Order ${orderNumber} succesvol gearchiveerd: order status = archived, ${archivedItemCount} items gearchiveerd`);
    return { 
      success: true, 
      message: `Order ${orderNumber} succesvol gearchiveerd`,
      details: {
        archivedItemCount
      }
    };
  } catch (error) {
    console.error(`Fout bij archiveren van order ${orderNumber}:`, error);
    return { 
      success: false, 
      message: `Fout bij archiveren van order ${orderNumber}: ${(error as Error).message}`
    };
  }
}

export function registerSpecialRoutes(app: express.Express) {
  
  // Endpoint om problemen met order 1555 op te lossen
  app.post("/api/fix-order-1555", async (req, res) => {
    try {
      console.log("⚙️ Reparatie van order 1555 gestart...");
      
      // Voer het fix script uit
      const result = await db.execute(sql.raw(`
        -- Dit script controleert order 1555 en markeert items als gearchiveerd 
        -- op basis van de shopify_line_item_id relatie

        -- Eerst vinden we de specifieke order
        WITH target_order AS (
          SELECT id FROM orders WHERE order_number = 'SW-1555'
        ),

        -- Dan vinden we alle items voor deze order
        order_items_all AS (
          SELECT * FROM order_items WHERE order_id IN (SELECT id FROM target_order)
        ),

        -- Identificeer items met dezelfde shopify_line_item_id (duplicaten)
        -- We willen per shopify_line_item_id slechts één actief item behouden
        grouped_items AS (
          SELECT 
            shopify_line_item_id,
            MIN(id) AS keep_id -- behoud het item met de laagste ID
          FROM order_items_all
          WHERE shopify_line_item_id IS NOT NULL
          GROUP BY shopify_line_item_id
        )

        -- Update items die gemarkeerd moeten worden als gearchiveerd
        -- Alleen items met dezelfde shopify_line_item_id waarvan er al één actief is
        UPDATE order_items
        SET 
          is_archived = true,
          status = 'archived',
          archived_reason = 'Automatisch gearchiveerd als duplicaat item voor order 1555'
        WHERE 
          id IN (
            SELECT oia.id
            FROM order_items_all oia
            JOIN grouped_items gi ON oia.shopify_line_item_id = gi.shopify_line_item_id
            WHERE oia.id != gi.keep_id AND oia.is_archived = false
          )
        RETURNING id;
      `));
      
      // Controleer het resultaat
      const rowsUpdated = result.rows ? result.rows.length : 0;
      console.log(`✅ Order 1555 fix script uitgevoerd: ${rowsUpdated} items gearchiveerd`);
      
      // Haal de order op (voor eventuele extra diagnostiek)
      const order = await storage.getOrderByOrderNumber("SW-1555");
      if (!order) {
        return res.status(404).json({ success: false, message: "Order SW-1555 niet gevonden" });
      }
      
      // Haal de resterende actieve items op
      const remainingItems = await storage.getOrderItems(order.id);
      console.log(`Order SW-1555 heeft nu ${remainingItems.length} actieve items`);
      
      return res.json({
        success: true,
        message: `Reparatie van order 1555 voltooid: ${rowsUpdated} dubbele items gearchiveerd`,
        details: {
          totalItemsRemaining: remainingItems.length,
          archivedCount: rowsUpdated
        }
      });
    } catch (error) {
      console.error("Error fixing order 1555:", error);
      return res.status(500).json({ 
        success: false,
        message: `Failed to fix order 1555: ${(error as Error).message}` 
      });
    }
  });
  
  // Specifieke endpoint om de Natey Fm4/Gm4 items in order 1542 te archiveren  
  app.post("/api/fix-order-1542", async (req, res) => {
    try {
      console.log("⚙️ Reparatie van order 1542 gestart...");
      
      // Haal order op
      const order = await storage.getOrderByOrderNumber("SW-1542");
      if (!order) {
        return res.status(404).json({ success: false, message: "Order SW-1542 niet gevonden" });
      }
      
      // Haal alle items op
      const items = await storage.getOrderItems(order.id);
      console.log(`Order SW-1542 heeft ${items.length} items in totaal`);
      
      // Haal shopify tracking op
      const shopifyTracking = await storage.getShopifyTracking(order.id) || { 
        orderId: order.id, 
        usedSuffixes: [], 
        itemMappings: [] 
      };
      
      // Vind ALLE Natey Fm4 en Gm4 items, inclusief nog actieve en gearchiveerde
      const nateyFm4Items = items.filter(item => 
        item.itemType.includes("Natey") && 
        item.itemType.includes("Fm4")
      );
      
      const nateyGm4Items = items.filter(item => 
        item.itemType.includes("Natey") && 
        item.itemType.includes("Gm4")
      );
      
      // Filter actieve items
      const activeNateyFm4Items = nateyFm4Items.filter(item => !item.isArchived);
      const activeNateyGm4Items = nateyGm4Items.filter(item => !item.isArchived);
      
      console.log(`Gevonden: ${activeNateyFm4Items.length} actieve Natey Fm4 items en ${activeNateyGm4Items.length} actieve Natey Gm4 items`);
      console.log(`Gevonden: ${nateyFm4Items.length} totale Natey Fm4 items en ${nateyGm4Items.length} totale Natey Gm4 items`);
      
      // Maak een lijst van alle shopify line item IDs
      const shopifyItemIds = new Set();
      
      // Vind alle shopify mappings voor deze items
      for (const mapping of shopifyTracking.itemMappings) {
        shopifyItemIds.add(mapping.shopifyLineItemId);
      }
      
      console.log(`Order heeft mappings voor ${shopifyItemIds.size} unieke Shopify line items`);
      
      // Voor order 1542 willen we precies één actief Natey Fm4 en één actief Natey Gm4 item
      // Alle andere Natey Fm4/Gm4 items moeten gearchiveerd zijn
      
      const itemsToArchive = [];
      
      // Kies de items om te archiveren
      if (activeNateyFm4Items.length > 0) {
        // Bewaar alleen de eerste, archiveer de rest
        const firstItem = activeNateyFm4Items[0];
        itemsToArchive.push(...activeNateyFm4Items.filter(item => item.id !== firstItem.id));
      }
      
      if (activeNateyGm4Items.length > 0) {
        // Bewaar alleen de eerste, archiveer de rest
        const firstItem = activeNateyGm4Items[0];
        itemsToArchive.push(...activeNateyGm4Items.filter(item => item.id !== firstItem.id));
      }
      
      console.log(`Archiveren van ${itemsToArchive.length} items...`);
      
      // Archiveer de geselecteerde items
      for (const item of itemsToArchive) {
        try {
          await storage.updateOrderItem(item.id, {
            isArchived: true,
            archivedReason: undefined,
            status: 'archived'
          });
          
          console.log(`✅ Item ${item.serialNumber} (${item.itemType}) succesvol gearchiveerd`);
        } catch (error) {
          console.error(`Fout bij archiveren van item ${item.serialNumber}:`, error);
        }
      }
      
      return res.json({
        success: true,
        message: `Reparatie van order 1542 voltooid: ${itemsToArchive.length} items gearchiveerd`,
        details: {
          totalItems: items.length,
          nateyFm4BeforeCount: nateyFm4Items.length,
          nateyGm4BeforeCount: nateyGm4Items.length,
          itemsArchived: itemsToArchive.map(item => ({
            id: item.id,
            serialNumber: item.serialNumber,
            itemType: item.itemType
          }))
        }
      });
    } catch (error) {
      console.error("Error fixing order 1542:", error);
      return res.status(500).json({ 
        success: false,
        message: `Failed to fix order 1542: ${(error as Error).message}` 
      });
    }
  });
  
  // Endpoint om een order volledig te archiveren (voor orders die in Shopify gearchiveerd zijn)
  app.post("/api/archive-order", async (req, res) => {
    try {
      const { orderNumber } = req.body;
      
      if (!orderNumber) {
        return res.status(400).json({ 
          success: false, 
          message: "Order nummer is vereist" 
        });
      }
      
      console.log(`Archiveringsverzoek ontvangen voor order: ${orderNumber}`);
      const result = await archiveOrder(orderNumber);
      return res.json(result);
    } catch (error) {
      console.error("Error archiving order:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Fout bij archiveren van order: ${(error as Error).message}` 
      });
    }
  });
  
  // Debug endpoint voor order 1542
  app.get("/api/debug-order-1542", async (req, res) => {
    try {
      // Haal order op
      const order = await storage.getOrderByOrderNumber("SW-1542");
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Haal items op
      const items = await storage.getOrderItems(order.id);
      
      // Haal shopify tracking op
      const shopifyTracking = await storage.getShopifyTracking(order.id);
      
      // Vind de Natey Fm4 en Gm4 items
      const nateyFm4Items = items.filter(item => 
        item.itemType.includes("Natey") && 
        item.itemType.includes("Fm4")
      );
      
      const nateyGm4Items = items.filter(item => 
        item.itemType.includes("Natey") && 
        item.itemType.includes("Gm4")
      );
      
      return res.json({
        order,
        items: items.map(item => ({
          id: item.id,
          serialNumber: item.serialNumber,
          itemType: item.itemType,
          isArchived: item.isArchived,
          status: item.status
        })),
        shopifyTracking,
        problemItems: {
          nateyFm4: nateyFm4Items.map(item => ({
            id: item.id,
            serialNumber: item.serialNumber,
            isArchived: item.isArchived
          })),
          nateyGm4: nateyGm4Items.map(item => ({
            id: item.id,
            serialNumber: item.serialNumber,
            isArchived: item.isArchived
          }))
        }
      });
    } catch (error) {
      console.error("Error in debug endpoint:", error);
      return res.status(500).json({ error: (error as Error).message });
    }
  });
  // Speciale endpoint om één specifieke order te synchroniseren
  app.post("/api/sync-specific-order", async (req, res) => {
    try {
      // Check if we have the required environment variables
      if (!process.env.SHOPIFY_ACCESS_TOKEN) {
        return res.status(400).json({ 
          message: "Shopify API configuration is incomplete. Please set the SHOPIFY_ACCESS_TOKEN environment variable." 
        });
      }
      
      const { orderNumber } = req.body;
      
      if (!orderNumber) {
        return res.status(400).json({ message: "Order number is required" });
      }
      
      console.log(`Synchroniseren van specifieke order ${orderNumber}...`);
      const result = await syncSpecificOrder(orderNumber);
      return res.json(result);
    } catch (error) {
      console.error("Error syncing specific order:", error);
      return res.status(500).json({ 
        message: `Failed to sync order: ${(error as Error).message}` 
      });
    }
  });

  // Speciale endpoint om specifieke orders als batch te hersynchroniseren
  app.post("/api/sync-batch-orders", async (req, res) => {
    try {
      const { orderNumbers } = req.body;
      
      if (!orderNumbers || !Array.isArray(orderNumbers) || orderNumbers.length === 0) {
        return res.status(400).json({ message: "Order numbers array is required" });
      }
      
      console.log(`Synchroniseren van ${orderNumbers.length} specifieke orders...`);
      
      const results = [];
      
      for (const orderNumber of orderNumbers) {
        console.log(`Synchroniseren van order ${orderNumber}...`);
        const result = await syncSpecificOrder(orderNumber);
        results.push({ orderNumber, result });
      }
      
      return res.json({
        success: true,
        message: `${results.length} orders gesynchroniseerd`,
        results
      });
    } catch (error) {
      console.error("Error syncing batch orders:", error);
      return res.status(500).json({ 
        message: `Failed to sync orders: ${(error as Error).message}` 
      });
    }
  });
}