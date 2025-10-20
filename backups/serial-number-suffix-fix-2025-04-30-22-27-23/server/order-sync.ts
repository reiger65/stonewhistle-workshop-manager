/**
 * Order sync utility voor probleemoplossing
 * Dit is een speciale module voor het bijwerken van orders met meerdere identieke items
 */

import { storage } from './storage';
import { Order, OrderItem } from '@shared/schema';
import fetch from 'node-fetch';

// Shopify API constants
const API_VERSION = '2023-10';
const SHOPIFY_DOMAIN = 'stonewhistle.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}`;

interface ShopifyLineItem {
  id: string | number;
  title: string;
  quantity: number;
  fulfillable_quantity: number;
  properties: Array<{ name: string; value: string }>;
}

interface ShopifyItemMapping {
  shopifyLineItemId: string;
  suffix: number;
  title: string;
}

interface ShopifyTracking {
  orderId: number;
  usedSuffixes: number[];
  itemMappings: ShopifyItemMapping[];
}

/**
 * Haalt een specifieke Shopify order op via de API
 */
async function getShopifyOrderById(orderId: string) {
  try {
    const apiPath = `/orders/${orderId}.json`;
    const url = `${SHOPIFY_API_URL}${apiPath}`;
    
    console.log(`Fetching Shopify order from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error (${response.status}): ${errorText}`);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}`,
        order: null
      };
    }
    
    const data = await response.json();
    
    if (!data.order) {
      return { success: false, error: 'No order data found', order: null };
    }
    
    return { success: true, error: null, order: data.order };
  } catch (error) {
    console.error('Error fetching Shopify order:', error);
    return { 
      success: false, 
      error: (error as Error).message,
      order: null
    };
  }
}

/**
 * Extract properties from line item
 */
function extractSpecifications(lineItem: ShopifyLineItem) {
  const specs: Record<string, string> = {};
  
  if (lineItem.properties && Array.isArray(lineItem.properties)) {
    for (const prop of lineItem.properties) {
      if (prop.name && prop.value) {
        // Clean up property name
        const key = prop.name.replace(/^_/, '').trim();
        specs[key] = prop.value.trim();
      }
    }
  }
  
  // Bewaar ook het shopify line item ID in de specificaties voor toekomstige referentie
  if (lineItem.id) {
    specs.shopifyLineItemId = String(lineItem.id);
  }
  
  return specs;
}

/**
 * Synchroniseert een specifieke workshop order met Shopify
 * Gefocust op het oplossen van issues met meerdere identieke items
 * 
 * Deze functie zorgt voor een permanente koppeling tussen Shopify line items en serienummers
 * door de shopifyLineItemId op te slaan bij elk order item. Deze ID wordt gebruikt om een
 * unieke relatie tussen een Shopify item en een serienummer te garanderen.
 * 
 * Dit voorkomt dat een Shopify line item ooit aan een ander serienummer wordt gekoppeld,
 * zelfs als er meerdere identieke items in een order zitten.
 */
export async function syncSpecificOrder(orderNumber: string) {
  try {
    // 1. Haal onze workshop order op
    const existingOrder = await storage.getOrderByOrderNumber(orderNumber);
    if (!existingOrder || !existingOrder.shopifyOrderId) {
      return { 
        success: false, 
        message: `Order ${orderNumber} niet gevonden of niet gekoppeld aan Shopify` 
      };
    }
    
    // 2. Haal alle items op voor deze order
    const existingItems = await storage.getOrderItems(existingOrder.id);
    console.log(`Order ${orderNumber} heeft ${existingItems.length} items in ons systeem`);
    
    // Logboek weergeven van bestaande items (inclusief archived status)
    for (const item of existingItems) {
      console.log(`- Item ${item.serialNumber}: ${item.isArchived ? 'GEARCHIVEERD' : 'ACTIEF'}`);
    }
    
    // 3. Haal shopify tracking info op
    const shopifyTracking = await storage.getShopifyTracking(existingOrder.id) || { 
      orderId: existingOrder.id,
      usedSuffixes: [], 
      itemMappings: []
    };
    
    // 4. Haal Shopify order op
    const shopifyData = await getShopifyOrderById(existingOrder.shopifyOrderId);
    if (!shopifyData.success || !shopifyData.order) {
      return { 
        success: false, 
        message: `Kon Shopify order ${existingOrder.shopifyOrderId} niet ophalen: ${shopifyData.error || 'Onbekende fout'}` 
      };
    }
    
    const shopifyOrder = shopifyData.order;
    
    // 4.1 Zoek naar items in ons systeem die niet meer in Shopify bestaan en archiveer deze
    console.log(`Controleren op verwijderde items voor order ${orderNumber}...`);
    
    // Maak een lijst van alle Shopify line item IDs
    const shopifyLineItemIds = new Set(shopifyOrder.line_items.map(item => String(item.id)));
    
    // Maak een lijst van alle item serienummers in deze order
    const allSerialNumbers = existingItems.map(item => item.serialNumber);
    
    // Maak een lijst van alle serienummers die nog in Shopify mappings staan
    const activeShopifySerialNumbers = shopifyTracking.itemMappings
      .filter(mapping => shopifyLineItemIds.has(String(mapping.shopifyLineItemId)))
      .map(mapping => `${orderNumber}-${mapping.suffix}`);
    
    console.log(`DEBUG: Huidige Shopify line items: ${Array.from(shopifyLineItemIds).join(', ')}`);
    console.log(`DEBUG: Actieve serienummers in Shopify: ${activeShopifySerialNumbers.join(', ')}`);
    console.log(`DEBUG: Alle serienummers in ons systeem: ${allSerialNumbers.join(', ')}`);
    
    // Archiveer items die niet meer in Shopify voorkomen maar wel in ons systeem staan
    for (const item of existingItems) {
      if (!item.isArchived && !activeShopifySerialNumbers.includes(item.serialNumber)) {
        console.log(`🗑️ Item ${item.serialNumber} komt niet meer voor in Shopify - archiveren`);
        
        try {
          await storage.updateOrderItem(item.id, {
            isArchived: true,
            archivedReason: 'Item niet meer aanwezig in Shopify order - specifieke synchronisatie',
            status: 'archived'
          });
          
          archivedCount++;
          console.log(`✅ Item ${item.serialNumber} succesvol gearchiveerd`);
        } catch (error) {
          console.error(`Fout bij archiveren van item ${item.serialNumber}:`, error);
        }
      }
    }
    
    // 5. Check for identical items
    const allLineItems = shopifyOrder.line_items || [];
    
    // Tel hoe vaak elk itemtype voorkomt
    const itemTypeCounts: Record<string, number> = {};
    for (const item of allLineItems) {
      const itemType = item.title || 'Ceramic Flute';
      itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
    }
    
    // Detecteer of deze order meerdere identieke items bevat
    const hasMultipleIdenticalItems = Object.values(itemTypeCounts).some(count => count > 1);
    
    console.log(`Order ${orderNumber} heeft ${allLineItems.length} line items in Shopify`);
    console.log(`Order ${orderNumber} bevat ${hasMultipleIdenticalItems ? 'WEL' : 'GEEN'} meerdere identieke items`);
    
    // Log details van Shopify line items
    for (const item of allLineItems) {
      console.log(`- Line item "${item.title}" (ID: ${item.id}): quantity=${item.quantity}, fulfillable=${item.fulfillable_quantity}`);
    }
    
    // 6. Check if we have enough mappings for all items
    // We moeten voor elk line item nagaan of we voldoende mappings hebben op basis van quantity
    const shopifyItemIdCount = new Map<string, { quantity: number, mapped: number }>();
    
    // Tel hoeveel mappings we nodig hebben per line item (op basis van quantity)
    for (const item of allLineItems) {
      const itemId = String(item.id);
      shopifyItemIdCount.set(itemId, { 
        quantity: item.quantity || 1, 
        mapped: 0 
      });
    }
    
    // Tel hoeveel mappings we al hebben per Shopify ID
    for (const mapping of shopifyTracking.itemMappings) {
      const counter = shopifyItemIdCount.get(mapping.shopifyLineItemId);
      if (counter) {
        counter.mapped += 1;
      }
    }
    
    // 7. Maak nu nieuwe mappings voor items die nog niet genoeg mappings hebben
    const currentMappings = [...shopifyTracking.itemMappings];
    let updatedMappings = false;
    
    for (const [shopifyItemId, counter] of shopifyItemIdCount.entries()) {
      // Vind het bijbehorende shopify item
      const item = allLineItems.find(item => String(item.id) === shopifyItemId);
      if (!item) continue;
      
      // Hoeveel nieuwe mappings hebben we nodig?
      const neededMappings = counter.quantity - counter.mapped;
      
      if (neededMappings > 0) {
        console.log(`Item "${item.title}" (ID: ${shopifyItemId}) heeft ${neededMappings} extra mappings nodig (quantity=${counter.quantity}, reeds gemapped=${counter.mapped})`);
        updatedMappings = true;
        
        // Maak de benodigde extra mappings aan
        for (let i = 0; i < neededMappings; i++) {
          // Vind volgende beschikbare suffix
          let nextSuffix = 1;
          while (shopifyTracking.usedSuffixes.includes(nextSuffix)) {
            nextSuffix++;
          }
          
          // Add to used suffixes
          shopifyTracking.usedSuffixes.push(nextSuffix);
          
          // Create new mapping
          currentMappings.push({
            shopifyLineItemId: shopifyItemId,
            suffix: nextSuffix,
            title: item.title || 'Ceramic Flute'
          });
          
          console.log(`🆕 Assigned new suffix ${nextSuffix} to Shopify item "${item.title}" (ID: ${shopifyItemId}) - extra mapping #${i+1}/${neededMappings}`);
        }
      }
    }
    
    // 8. Update the shopify tracking in database with our current mappings if changed
    if (updatedMappings) {
      await storage.updateShopifyTracking(existingOrder.id, {
        orderId: existingOrder.id,
        usedSuffixes: shopifyTracking.usedSuffixes,
        itemMappings: currentMappings
      });
      console.log(`✅ Updated Shopify tracking for order ${orderNumber} with ${currentMappings.length} mappings`);
    }
    
    // 9. Process all visible mappings and reactivate archived items as needed
    let reactivatedCount = 0;
    let createdCount = 0;
    let archivedCount = 0;
    
    // Detecteer items die wel in onze database zitten maar niet in de huidige Shopify mappings (deze moeten gearchiveerd worden)
    console.log(`Controleren op items die gearchiveerd moeten worden voor order ${orderNumber}`);
    
    // Verzamel alle serienummers uit de huidige mappings
    const currentSerialNumbers = currentMappings.map(mapping => `${orderNumber}-${mapping.suffix}`);
    console.log(`DEBUG: Huidige serienummers in mappings: ${currentSerialNumbers.join(', ')}`);
    
    // Debug: log alle bestaande items
    console.log(`DEBUG: Bestaande items: ${existingItems.map(item => `${item.serialNumber}(${item.isArchived ? 'ARCHIVED' : 'ACTIVE'})`).join(', ')}`);
    
    // Check welke items in onze database niet meer voorkomen in de Shopify order
    for (const item of existingItems) {
      if (!item.isArchived && !currentSerialNumbers.includes(item.serialNumber)) {
        console.log(`🗑️ Item ${item.serialNumber} komt niet meer voor in Shopify - archiveren`);
        
        try {
          await storage.updateOrderItem(item.id, {
            isArchived: true,
            archivedReason: 'Item niet meer aanwezig in Shopify order',
            status: 'archived'
          });
          
          archivedCount++;
          console.log(`✅ Item ${item.serialNumber} succesvol gearchiveerd`);
        } catch (error) {
          console.error(`Fout bij archiveren van item ${item.serialNumber}:`, error);
        }
      }
    }
    
    // Voor orders met meerdere identieke items nemen we ALLE mappings mee 
    console.log(`Processing ${currentMappings.length} items for order ${orderNumber} (special mode for multiple identical items)`);
    
    for (const mapping of currentMappings) {
      const serialNumber = `${orderNumber}-${mapping.suffix}`;
      
      // Vind het bijbehorende Shopify item
      const shopifyItem = allLineItems.find(item => String(item.id) === mapping.shopifyLineItemId);
      
      if (!shopifyItem) {
        console.warn(`⚠️ Geen Shopify item gevonden voor mapping met ID ${mapping.shopifyLineItemId} en suffix ${mapping.suffix}`);
        continue;
      }
      
      // Vind evt. bestaand item in onze database
      const existingItem = existingItems.find(item => item.serialNumber === serialNumber);
      
      if (!existingItem) {
        // Dit is een nieuw item dat we moeten aanmaken
        console.log(`Item ${serialNumber} aanmaken (shopify item ID: ${mapping.shopifyLineItemId})`);
        
        try {
          // Controleer of het fulfillable is of een speciale behandeling nodig heeft
          const shouldForceReactivation = shopifyItem.fulfillable_quantity > 0;
          
          // Bij order 1542 en Natey Fm4/Gm4/Am4 speciale logica toepassen
          const isKnownProblemItem = orderNumber === "SW-1542" && 
                                    mapping.title && 
                                    (mapping.title.includes("Natey Fm4") || 
                                     mapping.title.includes("Natey Gm4") ||
                                     mapping.title.includes("Natey Am4"));
          
          // Voor items die we gecontroleerd hebben dat ze verwijderd zijn, nooit reactiveren
          // We gebruiken hier geen forceReactivation meer maar laten de database-storage beslissen
          // op basis van de verbeterde logica daar
          const forceReactivation = false;
          
          // Gebruik direct de storage functie met aangepaste forceReactivation optie
          // Voeg Shopify line item ID toe voor permanente koppeling
          const shopifyLineItemId = String(shopifyItem.id);
          
          const item = await storage.findOrCreateOrderItem({
            orderId: existingOrder.id,
            serialNumber,
            itemType: mapping.title || shopifyItem.title || 'Ceramic Flute',
            status: 'ordered',
            specifications: extractSpecifications(shopifyItem),
            statusChangeDates: {},
            isArchived: false,
            archivedReason: null,
            shopifyLineItemId: shopifyLineItemId // Bewaar de Shopify line item ID voor permanente koppeling
          }, {
            // Forceer reactivatie alleen als het item fulfillable is EN geen Natey Fm4/Gm4 item is in order 1542
            forceReactivation
          });
          
          // Als het item gereactiveerd is (was gearchiveerd maar is nu actief)
          if (item && !item.isArchived) {
            if (existingItem && existingItem.isArchived) {
              reactivatedCount++;
              console.log(`✅ Item ${serialNumber} succesvol gereactiveerd via findOrCreateOrderItem`);
            } else {
              createdCount++;
              console.log(`✅ Item ${serialNumber} succesvol aangemaakt met ID ${item.id}`);
            }
          } else {
            // Item is nog steeds gearchiveerd of er is iets misgegaan
            console.log(`✅ Item ${serialNumber} succesvol verwerkt met ID ${item.id}`);
          }
        } catch (err) {
          console.error(`Error creating order item ${serialNumber}:`, err);
        }
      } else if (existingItem.isArchived && shopifyItem.fulfillable_quantity > 0) {
        // Controleer bij order 1542 en Natey Fm4/Gm4/Am4 of we wel moeten reactiveren 
        const isKnownProblemItem = orderNumber === "SW-1542" && 
                                 existingItem.itemType && 
                                 (existingItem.itemType.includes("Natey Fm4") || 
                                  existingItem.itemType.includes("Natey Gm4") ||
                                  existingItem.itemType.includes("Natey Am4"));
        
        // Voor specifieke items niet reactiveren zelfs als ze fulfillable zijn
        if (isKnownProblemItem) {
          console.log(`⏭️ Item ${serialNumber} is een bekend probleemitem in order 1542 - NIET reactiveren`);
          return;
        }
        
        // Haal de Shopify line item ID op
        const shopifyLineItemId = String(shopifyItem.id);
        
        // Reactiveer het item omdat het nog steeds fulfillable is in Shopify, ongeacht het ordertype
        console.log(`🔄 REACTIVEREN van gearchiveerd item ${serialNumber} omdat het nog steeds fulfillable is in Shopify (quantity: ${shopifyItem.fulfillable_quantity})`);
        try {
          await storage.updateOrderItem(existingItem.id, {
            itemType: mapping.title || shopifyItem.title || existingItem.itemType,
            specifications: {
              ...existingItem.specifications,
              ...extractSpecifications(shopifyItem)
            },
            isArchived: false,
            archivedReason: null,
            status: 'ordered', // Reset status to ordered when reactivating
            shopifyLineItemId: shopifyLineItemId // Update Shopify line item ID
          });
          reactivatedCount++;
          console.log(`✅ Item ${serialNumber} succesvol gereactiveerd`);
        } catch (err) {
          console.error(`Error reactivating order item ${serialNumber}:`, err);
        }
      } else if (!existingItem.isArchived) {
        // Normaal bijwerken
        console.log(`Item ${serialNumber} bijwerken met actuele gegevens uit Shopify (metadata-only update)`);
        
        // Haal de Shopify line item ID op
        const shopifyLineItemId = String(shopifyItem.id);
        
        try {
          await storage.updateOrderItem(existingItem.id, {
            itemType: mapping.title || shopifyItem.title || existingItem.itemType,
            specifications: {
              ...existingItem.specifications,
              ...extractSpecifications(shopifyItem)
            },
            shopifyLineItemId: shopifyLineItemId // Update Shopify line item ID
          });
        } catch (err) {
          console.error(`Error updating order item ${serialNumber}:`, err);
        }
      }
    }
    
    return { 
      success: true, 
      message: `Order ${orderNumber} succesvol gesynchroniseerd`,
      details: {
        hasMultipleIdenticalItems,
        itemsInShopify: allLineItems.length,
        itemsInWorkshop: existingItems.length,
        mappingsCreated: updatedMappings ? currentMappings.length - shopifyTracking.itemMappings.length : 0,
        itemsCreated: createdCount,
        itemsReactivated: reactivatedCount,
        itemsArchived: archivedCount
      }
    };
  } catch (error) {
    console.error('Error syncing specific order:', error);
    return { 
      success: false, 
      message: `Failed to sync order: ${(error as Error).message}` 
    };
  }
}