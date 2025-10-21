// Shopify API integration with direct fetch approach
import { Order } from '@shared/schema';
import { storage } from './storage';
import { format, parse } from 'date-fns';
import fetch from 'node-fetch';
import { 
  registerShopifyLineItemMapping,
  checkSerialNumberIntegrity 
} from '../shared/serial-number-database';
import { scheduleBackupAfterSync } from './backup-service';

// Shopify API constants
const API_VERSION = '2023-10';
// Use the domain provided by the user directly
const SHOPIFY_DOMAIN = 'stonewhistle.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

// Base Shopify API URL
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}`;

console.log(`Configured Shopify API URL: ${SHOPIFY_API_URL} with token: ${ACCESS_TOKEN ? 'Present' : 'Missing'}`);

/**
 * Laad alle shopify_item_tracking mappings uit de database
 * en vul de SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER map om ervoor te zorgen dat
 * serienummers consistent blijven tussen server herstarts
 */
export async function loadShopifyLineItemMappings() {
  try {
    console.log("🔄 Laden van Shopify line item → serienummer mappings uit database...");
    
    // Haal alle orders op uit de database
    const orders = await storage.getOrders();
    let totalMappings = 0;
    
    // Loop door alle orders
    for (const order of orders) {
      // Haal shopify tracking gegevens op voor deze order
      const tracking = await storage.getShopifyTracking(order.id);
      
      if (tracking && tracking.itemMappings && Array.isArray(tracking.itemMappings)) {
        // Loop door alle item mappings
        for (const mapping of tracking.itemMappings) {
          if (mapping.shopifyLineItemId && mapping.suffix) {
            // Maak het volledige serienummer
            const serialNumber = `${order.orderNumber.replace('SW-', '')}-${mapping.suffix}`;
            
            // Registreer de mapping
            registerShopifyLineItemMapping(mapping.shopifyLineItemId, serialNumber);
            totalMappings++;
          }
        }
      }
    }
    
    console.log(`✅ Succesvol ${totalMappings} Shopify line item → serienummer mappings geladen uit database`);
  } catch (error) {
    console.error("❌ Fout bij laden van Shopify line item mappings:", error);
  }
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrderResponse[];
}

interface ShopifyOrderResponse {
  id: string;
  name: string;
  order_number: number;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  shipping_address: {
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  } | null;
  billing_address: {
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  } | null;
  line_items: Array<{
    id: string;
    title: string;
    variant_title: string | null;
    properties: Array<{ name: string; value: string }>;
    quantity: number;
    price: string;
    sku: string;
    fulfillment_status: string | null;
    fulfillment_quantity: number | null;
    fulfillable_quantity: number;
  }>;
  created_at: string;
  processed_at: string;
  note: string | null;
  total_price: string;
  financial_status: string;
  fulfillment_status: string | null;
  fulfillments: Array<{
    id: number;
    order_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    tracking_company: string;
    tracking_number: string;
    tracking_url: string;
    estimated_delivery_at: string | null;
  }> | null;
}

/**
 * Generate a workshop order number from Shopify order
 * 
 * @param shopifyOrderId - Het Shopify order ID
 * @param includePrefix - Of de "SW-" prefix moet worden toegevoegd (default: false)
 * @returns Het ordernummer, met of zonder "SW-" prefix
 */
export function generateOrderNumber(shopifyOrderId: string | number, includePrefix: boolean = false): string {
  // Convert to string first, then use slice to get the last 4 digits
  const idString = String(shopifyOrderId);
  const orderNumber = idString.slice(-4);
  
  // Return with or without prefix based on parameter
  return includePrefix ? `SW-${orderNumber}` : orderNumber;
}

/**
 * Extracts flute type from title
 * @param title The title to extract from
 * @returns The extracted flute type or undefined
 */
export function extractFluteTypeFromTitle(title: string): string | undefined {
  if (!title) return undefined;
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('innato')) {
    return 'INNATO';
  } else if (titleLower.includes('natey')) {
    return 'NATEY';
  } else if (titleLower.includes('double')) {
    return 'DOUBLE';
  } else if (titleLower.includes('zen')) {
    return 'ZEN';
  } else if (titleLower.includes('cards')) {
    return 'CARDS';
  }
  
  return undefined;
}

/**
 * Extracts tuning from title
 * @param title The title to extract from
 * @returns The extracted tuning or undefined
 */
export function extractTuningFromTitle(title: string): string | undefined {
  if (!title) return undefined;
  
  // Extract tuning note from title if available
  // Bijvoorbeeld "Innato Dm4" of "Natey Am3"
  // Enhanced regex to capture more tuning notes
  const noteMatch = title.match(/([A-G][#b]?m?[0-9])/i);
  if (noteMatch) {
    return noteMatch[1];
  }
  
  // Special handling for ZEN flutes
  const titleLower = title.toLowerCase();
  if (titleLower.includes('zen')) {
    if (titleLower.includes('small') || titleLower.includes('mini')) {
      return 'S';
    } else if (titleLower.includes('medium')) {
      return 'M';
    } else if (titleLower.includes('large')) {
      return 'L';
    }
  }
  
  return undefined;
}

/**
 * Extract specifications from Shopify line item properties
 * 
 * @param lineItem - Het Shopify line item
 * @param serialNumber - Het serienummer (optioneel, voor integriteitscontrole)
 */
export function extractSpecifications(lineItem: ShopifyOrderResponse['line_items'][0], serialNumber?: string): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // STAP 1: Basis-eigenschappen uit Shopify halen
  
  // Extract from title (usually contains instrument type and note)
  if (lineItem.title) {
    // Store the full title as type
    specs['type'] = lineItem.title;
    
    // Extract flute type using the helper function
    const fluteType = extractFluteTypeFromTitle(lineItem.title);
    if (fluteType) {
      specs['model'] = fluteType;
      specs['fluteType'] = fluteType;
    }
    
    // Try to extract tuning frequency from title
    // VERBETERD: Betere detectie van frequentie in titel
    if (lineItem.title.includes('432')) {
      specs['tuningFrequency'] = '432Hz';
      specs['frequency'] = '432';
      console.log(`📊 Frequentie 432Hz gevonden in titel: ${lineItem.title}`);
    } else if (lineItem.title.includes('440')) {
      specs['tuningFrequency'] = '440Hz';
      specs['frequency'] = '440';
      console.log(`📊 Frequentie 440Hz gevonden in titel: ${lineItem.title}`);
    } else {
      // Standaard is 440Hz als niets anders is opgegeven
      specs['tuningFrequency'] = '440Hz';
      specs['frequency'] = '440';
      console.log(`📊 Standaard frequentie 440Hz toegekend aan: ${lineItem.title}`);
    }
    
    // Extract tuning using the helper function
    const tuning = extractTuningFromTitle(lineItem.title);
    if (tuning) {
      specs['tuning'] = tuning;
    }
  }
  
  // Extract from variant title (e.g. "Blue / D / Engraved")
  if (lineItem.variant_title) {
    const variantParts = lineItem.variant_title.split(' / ');
    if (variantParts.length >= 1) specs['color'] = variantParts[0];
    if (variantParts.length >= 2) specs['key'] = variantParts[1];
    if (variantParts.length >= 3) specs['engraving'] = variantParts[2] === 'Engraved' ? 'Yes' : 'No';
  }
  
  // Extract from line item properties
  if (lineItem.properties && lineItem.properties.length > 0) {
    lineItem.properties.forEach(prop => {
      specs[prop.name] = prop.value;
      
      // Special handling for common properties
      const propNameLower = prop.name.toLowerCase();
      if (propNameLower.includes('color')) {
        specs['color'] = prop.value;
      }
      if (propNameLower.includes('frequency') || propNameLower.includes('tuning') || propNameLower.includes('hz')) {
        specs['tuningFrequency'] = prop.value;
        // Ook frequentie extraheren in gestandaardiseerd formaat
        if (prop.value.includes('432')) {
          specs['frequency'] = '432';
        } else if (prop.value.includes('440')) {
          specs['frequency'] = '440';
        }
      }
      if (propNameLower.includes('type') || propNameLower.includes('model')) {
        specs['type'] = prop.value;
        
        // Ook fluteType vullen
        const typeLower = prop.value.toLowerCase();
        if (typeLower.includes('innato')) {
          specs['fluteType'] = 'INNATO';
        } else if (typeLower.includes('natey')) {
          specs['fluteType'] = 'NATEY';
        } else if (typeLower.includes('double')) {
          specs['fluteType'] = 'DOUBLE';
        } else if (typeLower.includes('zen')) {
          specs['fluteType'] = 'ZEN';
        }
      }
    });
  }

  // Add SKU if available
  if (lineItem.sku) {
    specs['SKU'] = lineItem.sku;
  }
  
  // ZEER BELANGRIJK: Bewaar fulfillable_quantity voor reactivatie beslissingen
  if (lineItem.fulfillable_quantity !== undefined) {
    specs['fulfillable_quantity'] = String(lineItem.fulfillable_quantity);
  }
  
  // STAP 2: INTEGRITEITSCONTROLE via de seriennummer database
  if (serialNumber) {
    try {
      // Gebruik de reeds geïmporteerde functie van bovenaan het bestand
      
      // Controleer of dit serienummer in de database staat
      const fixedSpecs = checkSerialNumberIntegrity(serialNumber, specs);
      
      // Als er verschillen zijn, log dit voor debugging
      if (fixedSpecs.fluteType !== specs.fluteType || fixedSpecs.tuning !== specs.tuning) {
        console.log(`🔒 INTEGRITEITSCONTROLE: ${serialNumber} specificaties aangepast:`, {
          was: {
            fluteType: specs.fluteType,
            tuning: specs.tuning,
            frequency: specs.frequency,
            color: specs.color
          },
          fixed: {
            fluteType: fixedSpecs.fluteType,
            tuning: fixedSpecs.tuning,
            frequency: fixedSpecs.frequency,
            color: fixedSpecs.color
          }
        });
      }
      
      // Gebruik de aangepaste specificaties
      return fixedSpecs;
    } catch (error) {
      console.error(`Error in extractSpecifications integriteitscontrole:`, error);
      // Bij een fout, gebruik de originele specs
    }
  }
  
  return specs;
}

/**
 * Helper function to add delay between API calls to avoid rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a rate-limited API call to Shopify
 */
async function shopifyApiCall(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ACCESS_TOKEN
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }
  
  // Wait only 100ms between API calls (still safe for Shopify's rate limit of 2 calls per second)
  await delay(100);
  
  return await response.json();
}

/**
 * Fetch orders directly from Shopify API
 * @param {string} [startDate] - Optional start date in ISO format (e.g., '2023-01-01T00:00:00Z')
 * @returns {Promise<ShopifyOrderResponse[]>} Array of Shopify order responses
 */
export async function fetchShopifyOrders(startDate?: string): Promise<ShopifyOrderResponse[]> {
  // Bepaal de datum 2 jaar geleden als er geen specifieke startdatum is opgegeven
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const twoYearsAgoISO = twoYearsAgo.toISOString();
  
  // Gebruik de opgegeven startdatum of standaard 2 jaar terug
  const dateFilter = startDate || twoYearsAgoISO;
  
  console.log(`Fetching orders from Shopify API since ${dateFilter}`);
  
  try {
    // Use fields parameter to explicitly request fulfillment details with tracking information
    // Nu met created_at_min parameter om alleen orders van de afgelopen 6 maanden te krijgen
    const unfulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&limit=250&created_at_min=${dateFilter}&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${unfulfilledData.orders.length} unfulfilled open orders from Shopify`);
    
    // We're fetching all orders in the first request now, so we can skip the next ones
    // but keeping the structure in case we need to paginate in the future
    const pendingData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?limit=0&created_at_min=${dateFilter}&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${pendingData.orders.length} pending unfulfilled orders from Shopify`);
    
    // Then, get partially fulfilled orders which might still be in process
    const partiallyFulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&fulfillment_status=partial&financial_status=any&limit=250&created_at_min=${dateFilter}&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${partiallyFulfilledData.orders.length} partially fulfilled orders from Shopify`);
    
    // Finally, add fulfilled orders that might still be relevant to the workshop
    // Now only from the last 6 months
    const fulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&fulfillment_status=fulfilled&financial_status=any&limit=250&created_at_min=${dateFilter}&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${fulfilledData.orders.length} fulfilled orders from Shopify`);
    
    // Combine all the orders
    const allOrders = [
      ...unfulfilledData.orders,
      ...pendingData.orders,
      ...partiallyFulfilledData.orders,
      ...fulfilledData.orders
    ];
    
    // Remove duplicates based on order ID
    const uniqueOrders = allOrders.filter((order, index, self) => 
      index === self.findIndex((o) => o.id === order.id)
    );
    
    console.log(`Total unique orders: ${uniqueOrders.length}`);
    
    return uniqueOrders;
  } catch (error) {
    console.error('Error fetching Shopify orders:', error);
    throw error;
  }
}

/**
 * Fetch fulfillment data for a specific Shopify order
 */
export async function fetchFulfillmentData(orderId: string): Promise<Array<{
  id: number;
  order_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_company: string;
  tracking_number: string;
  tracking_url: string;
  estimated_delivery_at: string | null;
  shipment_status?: string;
}>> {
  try {
    const fulfillmentUrl = `${SHOPIFY_API_URL}/orders/${orderId}/fulfillments.json`;
    console.log(`Fetching fulfillment data for order ID ${orderId}`);
    
    const response = await fetch(fulfillmentUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fulfillment data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as { fulfillments: Array<{
      id: number;
      order_id: number;
      status: string;
      created_at: string;
      updated_at: string;
      tracking_company: string;
      tracking_number: string;
      tracking_url: string;
      estimated_delivery_at: string | null;
      shipment_status?: string;
    }> };
    
    return data.fulfillments || [];
  } catch (error) {
    console.error(`Error fetching fulfillment for order ${orderId}:`, error);
    return [];
  }
}

/**
 * Fetch order fulfillment details 
 */
export async function fetchShopifyOrderFulfillment(orderId: string | number) {
  try {
    const url = `${SHOPIFY_API_URL}/orders/${orderId}/fulfillment_orders.json`;
    console.log(`Fetching fulfillment orders for order ID ${orderId}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fulfillment orders: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Also fetch the detailed fulfillments if available
    try {
      const fulfillmentsUrl = `${SHOPIFY_API_URL}/orders/${orderId}/fulfillments.json`;
      const fulfillmentsResponse = await fetch(fulfillmentsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN
        }
      });
      
      if (fulfillmentsResponse.ok) {
        const fulfillmentsData = await fulfillmentsResponse.json();
        data.fulfillments = fulfillmentsData.fulfillments;
      }
    } catch (err) {
      console.error('Error fetching detailed fulfillments:', err);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching fulfillment orders for order ${orderId}:`, error);
    return { fulfillment_orders: [] };
  }
}

// Import de progress callback
import { onShopifyOrderProgress } from './scheduler';

/**
 * Controleert op en repareert dubbele items voor een order
 * Verwijdert items die dubbel voorkomen op basis van shopifyLineItemId mapping
 * 
 * @param orderId Het ID van de order om te controleren
 * @param existingItems Array van bestaande items voor deze order
 * @returns True als er dubbele items zijn gevonden en verwijderd
 */
export async function checkAndCleanupDuplicateItems(orderId: number, existingItems: Array<any>): Promise<boolean> {
  console.log(`🔍 Controleren op dubbele items voor order ID: ${orderId} met ${existingItems.length} items`);

  // Groepeer items op basis van shopifyLineItemId
  const itemsByShopifyId = new Map();
  const itemsWithoutShopifyId = [];

  // Stap 1: Groepeer items op shopifyLineItemId
  for (const item of existingItems) {
    if (item.shopifyLineItemId) {
      if (!itemsByShopifyId.has(item.shopifyLineItemId)) {
        itemsByShopifyId.set(item.shopifyLineItemId, []);
      }
      itemsByShopifyId.get(item.shopifyLineItemId).push(item);
    } else {
      itemsWithoutShopifyId.push(item);
    }
  }

  // Stap 2: Check voor duplicaten
  let foundDuplicates = false;
  let fixedCount = 0;

  for (const [shopifyId, items] of itemsByShopifyId.entries()) {
    if (items.length > 1) {
      foundDuplicates = true;
      console.log(`⚠️ DUBBELE ITEMS: ${items.length} items met shopifyLineItemId ${shopifyId}`);

      // Sorteer items op serienummer: laagste nummers behouden
      items.sort((a, b) => {
        const suffixA = parseInt(a.serialNumber.split('-')[1]);
        const suffixB = parseInt(b.serialNumber.split('-')[1]);
        return suffixA - suffixB;
      });

      // Behoud het eerste item (laagste serienummer suffix) en archiveer de rest
      const itemToKeep = items[0];
      const itemsToArchive = items.slice(1);

      console.log(`✅ Behouden: ${itemToKeep.serialNumber} (ID: ${itemToKeep.id})`);
      
      for (const duplicateItem of itemsToArchive) {
        console.log(`🗑️ Archiveren: ${duplicateItem.serialNumber} (ID: ${duplicateItem.id}), permanent gekoppeld aan ${itemToKeep.serialNumber}`);
        
        try {
          await storage.updateOrderItem(duplicateItem.id, {
            status: 'archived',
            isArchived: true,
            archivedReason: `Automatisch gearchiveerd omdat dit een dubbel item is van ${itemToKeep.serialNumber}`
          });
          fixedCount++;
        } catch (err) {
          console.error(`Fout bij archiveren van dubbel item ${duplicateItem.serialNumber}:`, err);
        }
      }
    }
  }

  if (foundDuplicates) {
    console.log(`🧹 Cleanup voltooid: ${fixedCount} dubbele items gearchiveerd voor order ID ${orderId}`);
  } else {
    console.log(`✅ Geen dubbele items gevonden voor order ID ${orderId}`);
  }

  return foundDuplicates;
}

/**
 * Fetch and sync orders from Shopify
 * @param {string} [period] - Optional period to limit the sync ("1month", "3months", "6months", "1year", "all")
 * @param {boolean} [forceUpdate] - Whether to force update existing orders even if they haven't changed
 */
export async function syncShopifyOrders(period?: string, forceUpdate: boolean = false): Promise<any> {
  try {
    console.log(`Starting Shopify order sync with period: ${period || '6 months (default)'}`);
    
    // Import the system-status functions
    const systemStatus = await import('./system-status');
    
    // Update system status to indicate sync has started
    systemStatus.updateSystemStatus({
      type: 'shopify_sync',
      status: 'started',
      message: `Shopify synchronisatie gestart voor periode: ${period || '6 maanden (standaard)'}`,
      timestamp: Date.now()
    });
    
    let startDate: string | undefined;
    
    // Bepaal de juiste startdatum op basis van de opgegeven periode
    if (period) {
      const now = new Date();
      
      switch (period) {
        case '1week':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          startDate = oneWeekAgo.toISOString();
          break;
        case '1month':
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          startDate = oneMonthAgo.toISOString();
          break;
        case '3months':
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          startDate = threeMonthsAgo.toISOString();
          break;
        case '6months':
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          startDate = sixMonthsAgo.toISOString();
          break;
        case '1year':
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          startDate = oneYearAgo.toISOString();
          break;
        case 'all':
          // Geen startdatum, alle orders ophalen
          startDate = undefined;
          break;
        default:
          // Standaard 6 maanden
          const defaultSixMonths = new Date();
          defaultSixMonths.setMonth(defaultSixMonths.getMonth() - 6);
          startDate = defaultSixMonths.toISOString();
      }
    }
    
    // Fetch orders from Shopify API with the appropriate start date
    const shopifyOrders = await fetchShopifyOrders(startDate);
    console.log(`Retrieved ${shopifyOrders.length} orders from Shopify`);
    
    // Maak een set van alle actieve Shopify order numbers voor snelle lookup
    const activeShopifyOrderNumbers = new Set(
      shopifyOrders.map(order => String(order.order_number))
    );
    console.log(`Actieve Shopify order nummers: ${shopifyOrders.length} orders`);
    
    // Controleer bestaande orders in onze database
    try {
      // Haal alle bestaande orders op die niet al gearchiveerd of geannuleerd zijn
      const existingOrders = await storage.getOrders();
      const activeOrders = existingOrders.filter(order => 
        order.status !== 'archived' && 
        order.status !== 'cancelled'
      );
      
      console.log(`Controleren van ${activeOrders.length} actieve orders in ons systeem tegen ${shopifyOrders.length} orders in Shopify`);
      
      // Voor elke actieve order, check of deze nog in Shopify bestaat
      for (const order of activeOrders) {
        // Extraheer het order number zonder 'SW-' prefix
        const orderNumber = order.orderNumber.replace('SW-', '');
        
        // Als de order niet meer in Shopify staat, is deze vermoedelijk gearchiveerd
        if (!activeShopifyOrderNumbers.has(orderNumber)) {
          console.log(`⚠️ Order ${order.orderNumber} (${orderNumber}) lijkt gearchiveerd in Shopify - markeren als archived`);
          
          try {
            // Update de orderstatus naar archived
            // Alleen status wijzigen, geen notes toevoegen om het commentaarveld schoon te houden
            await storage.updateOrder(order.id, {
              status: 'archived'
            });
            
            // Archiveer ook alle items van deze order
            const orderItems = await storage.getOrderItems(order.id);
            for (const item of orderItems) {
              if (!item.isArchived) {
                await storage.updateOrderItem(item.id, {
                  isArchived: true,
                  archivedReason: 'Order automatisch gearchiveerd omdat deze niet meer actief is in Shopify',
                  status: 'archived'
                });
              }
            }
            
            console.log(`✅ Order ${order.orderNumber} en bijbehorende items succesvol gearchiveerd`);
          } catch (error) {
            console.error(`Fout bij archiveren van order ${order.orderNumber}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Fout bij controleren van gearchiveerde orders:', error);
    }
    
    // Update de voortgangsstatus
    onShopifyOrderProgress({
      currentOrder: 0,
      totalOrders: shopifyOrders.length,
      currentOrderNumber: ''
    });
    
    // Special diagnostic to check if we can access fulfillment data
    console.log(`⏳ Testing fulfillment data access using a separate API call...`);
    const testOrderId = shopifyOrders.find(order => order.fulfillment_status === 'fulfilled')?.id;
    
    if (testOrderId) {
      console.log(`🧪 Testing fulfillment data retrieval for order ID: ${testOrderId}`);
      const fulfillments = await fetchFulfillmentData(testOrderId);
      
      if (fulfillments.length > 0) {
        console.log(`✅ Successfully retrieved ${fulfillments.length} fulfillments for test order`);
        console.log(`Fulfillment data example:`, {
          tracking_number: fulfillments[0].tracking_number,
          tracking_company: fulfillments[0].tracking_company,
          tracking_url: fulfillments[0].tracking_url
        });
      } else {
        console.log(`❌ No fulfillments found for test order`);
      }
    } else {
      console.log(`❌ Could not find a fulfilled order to test with`);
    }
    
    const importedOrders: Order[] = [];
    
    // Process each Shopify order
    for (let i = 0; i < shopifyOrders.length; i++) {
      const shopifyOrder = shopifyOrders[i];
      
      // Update voortgangsstatus
      onShopifyOrderProgress({
        currentOrder: i + 1,
        totalOrders: shopifyOrders.length,
        currentOrderNumber: `SW-${String(shopifyOrder.order_number).slice(-4)}`
      });
      
      // Volledig fulfilled orders overslaan omdat ze niet meer kunnen veranderen
      // en we hebben ze al in het systeem met 'delivered' status
      let orderNumber = `SW-${String(shopifyOrder.order_number).slice(-4)}`;
      if (shopifyOrder.fulfillment_status === 'fulfilled') {
        console.log(`⏭️ Fully fulfilled order ${orderNumber} - updating to archived status`);
        
        // Check if this order already exists in our system by Shopify ID
        const existingOrderById = await storage.getOrderByShopifyId(shopifyOrder.id.toString());
        
        if (existingOrderById) {
          // Update the existing order to be archived
          console.log(`📦 Archiving order ${existingOrderById.orderNumber} because it's fulfilled in Shopify`);
          await storage.updateOrder(existingOrderById.id, {
            status: 'archived',
            archived: true  // Set both status and archived flag
          });
          
          // Also update the items to be archived
          const orderItems = await storage.getOrderItemsByOrderId(existingOrderById.id);
          for (const item of orderItems) {
            await storage.updateOrderItem(item.id, {
              isArchived: true,
              archivedReason: 'Order fulfilled in Shopify'
            });
          }
        }
        
        continue; // Ga door naar de volgende order
      }
      
      console.log(`Processing Shopify order #${shopifyOrder.order_number} (ID: ${shopifyOrder.id})`);
      
      // Check if this order already exists in our system by Shopify ID
      const existingOrderById = await storage.getOrderByShopifyId(shopifyOrder.id.toString());
      
      if (existingOrderById) {
        // This is an existing order - check if we need to update status or items
        console.log(`Checking order ${existingOrderById.orderNumber}: Shopify fulfillment=${shopifyOrder.fulfillment_status}, financial=${shopifyOrder.financial_status}, our status=${existingOrderById.status}`);
        
        // Controleer of de reseller-detectie aangepast moet worden voor bestaande orders
        const customerEmail = shopifyOrder.customer?.email || '';
        
        if (customerEmail && (!existingOrderById.isReseller || !existingOrderById.resellerNickname)) {
          try {
            // Gebruik de slimme reseller detectie functie
            const resellerDetection = await storage.detectResellerFromEmail(customerEmail);
            
            // Check if resellerDetection is valid and has the expected properties
            if (resellerDetection && typeof resellerDetection === 'object' && resellerDetection.isReseller) {
              console.log(`🔄 Reseller detectie voor bestaande order ${existingOrderById.orderNumber}: e-mail ${customerEmail} matcht met reseller ${resellerDetection.resellerNickname}`);
              
              // Update de order met de juiste reseller gegevens
              await storage.updateOrder(existingOrderById.id, {
                isReseller: true,
                resellerNickname: resellerDetection.resellerNickname,
                orderType: 'reseller'
              });
              
              console.log(`✅ Order ${existingOrderById.orderNumber} bijgewerkt met reseller nickname: ${resellerDetection.resellerNickname}`);
            }
          } catch (error) {
            console.warn(`⚠️  Reseller detection failed for existing order ${existingOrderById.orderNumber} email ${customerEmail}:`, error.message);
            // Continue without reseller detection if it fails
          }
        }
        
        // Sync order notes if they've changed in Shopify
        if (shopifyOrder.note && shopifyOrder.note !== existingOrderById.notes) {
          // Update the notes in our order
          await storage.updateOrder(existingOrderById.id, {
            notes: shopifyOrder.note
          });
          console.log(`✅ Updated notes for order ${existingOrderById.orderNumber} from Shopify`);
          
          // Check if we need to add the note as a production note as well
          const productionNotes = await storage.getOrderProductionNotes(existingOrderById.id);
          const noteAlreadyExists = productionNotes.some(note => 
            note.source === 'shopify' && note.note === shopifyOrder.note
          );
          
          if (!noteAlreadyExists) {
            await storage.createProductionNote({
              orderId: existingOrderById.id,
              note: shopifyOrder.note,
              createdBy: 'Shopify Klant',
              source: 'shopify', // Markeer deze opmerking als afkomstig van Shopify
            });
            console.log(`✅ Nieuwe Shopify opmerking toegevoegd als production note voor order ${existingOrderById.orderNumber}`);
          }
        }
        
        // === ITEM SYNCHRONISATIE ===
        // Haal bestaande orderitems en Shopify-tracking informatie op
        const existingItems = await storage.getOrderItems(existingOrderById.id);
        
        // Controleer op en archiveer dubbele items als een stap vóór synchronisatie
        // Op deze manier worden duplicaten automatisch opgeruimd in elke sync
        await checkAndCleanupDuplicateItems(existingOrderById.id, existingItems);
        
        // Haal de items opnieuw op na cleanup van dubbele items
        const cleanedItems = await storage.getOrderItems(existingOrderById.id);
        
        const shopifyTracking = await storage.getShopifyTracking(existingOrderById.id) || { 
          orderId: existingOrderById.id,
          usedSuffixes: [], 
          itemMappings: []
        };
        
        // Get ALL line items from Shopify, including fulfilled and unfulfilled
        const allLineItems = shopifyOrder.line_items;
        
        // Filter line items that are fulfillable (quantity > 0)
        const fulfillableLineItems = allLineItems.filter(item => item.fulfillable_quantity > 0);
        
        // Create a map of existing items by suffix for quick lookups
        // Gebruik het opgeschoonde items lijstje (cleanedItems) in plaats van originele existingItems
        const existingItemsBySuffix = new Map();
        for (const item of cleanedItems) {
          const suffix = parseInt(item.serialNumber.split('-')[1]);
          existingItemsBySuffix.set(suffix, item);
        }
        
        // Log line item details
        console.log(`Order ${existingOrderById.orderNumber} has ${allLineItems.length} total line items, of which ${fulfillableLineItems.length} are still fulfillable`);
        allLineItems.forEach(item => {
          console.log(`  • Line item "${item.title}" (ID: ${item.id}): fulfillable_quantity=${item.fulfillable_quantity}, active=${item.fulfillable_quantity > 0 ? 'YES' : 'NO'}`);
        });
        
        // STAP 1: Update shopify tracking - verwerk nieuwe items en behoud bestaande mappings
        // Maak een set van huidige Shopify item IDs voor snellere lookups
        const currentShopifyItemIds = new Set(allLineItems.map(item => String(item.id)));
        
        // Filter de bestaande mappings om alleen actuele items te behouden
        const currentMappings = shopifyTracking.itemMappings.filter(mapping => 
          currentShopifyItemIds.has(String(mapping.shopifyLineItemId))
        );
        
        // We moeten voor elk line item nagaan of we voldoende mappings hebben op basis van quantity
        const shopifyItemIdCount = new Map<string, { quantity: number, mapped: number }>();
        
        // Tel hoeveel mappings we nodig hebben per line item (op basis van quantity)
        // VERBETERD: Garandeer dat we de volledige quantity respecteren zoals ingesteld in Shopify
        for (const item of allLineItems) {
          const itemId = String(item.id);
          
          // Verzeker dat quantity altijd een geldige waarde heeft
          // Het probleem was mogelijk dat sommige items een quantity van 0 hadden
          const quantity = Number(item.quantity) || 1;
          
          // Log voor diagnose
          console.log(`📊 Line item "${item.title}" (ID: ${itemId}) heeft quantity=${quantity} in Shopify`);
          
          shopifyItemIdCount.set(itemId, { 
            quantity, 
            mapped: 0 
          });
        }
        
        // Tel hoeveel mappings we al hebben per Shopify ID
        for (const mapping of currentMappings) {
          const counter = shopifyItemIdCount.get(mapping.shopifyLineItemId);
          if (counter) {
            counter.mapped += 1;
            console.log(`Bestaande mapping gevonden voor Shopify item ${mapping.shopifyLineItemId}, geteld: ${counter.mapped}/${counter.quantity}`);
          }
        }
        
        // Maak nu nieuwe mappings voor items die nog niet genoeg mappings hebben
        for (const [shopifyItemId, counter] of shopifyItemIdCount.entries()) {
          // Vind het bijbehorende shopify item
          const item = allLineItems.find(item => String(item.id) === shopifyItemId);
          if (!item) continue;
          
          // Hoeveel nieuwe mappings hebben we nodig?
          const neededMappings = counter.quantity - counter.mapped;
          
          if (neededMappings > 0) {
            console.log(`Item "${item.title}" (ID: ${shopifyItemId}) heeft ${neededMappings} extra mappings nodig (quantity=${counter.quantity}, reeds gemapped=${counter.mapped})`);
            
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
              
              // Registreer ook de permanente koppeling in de centrale database 
              // Dit zorgt ervoor dat dezelfde Shopify line item ID altijd aan hetzelfde serienummer wordt gekoppeld
              const orderNumberWithoutPrefix = existingOrderById.orderNumber.replace(/^SW-/, '');
              const serialNumber = `${orderNumberWithoutPrefix}-${nextSuffix}`;
              
              // Belangrijk: hier gebruiken we de functie uit de gedeelde database module 
              // om de koppeling zowel in memory database als in de runtime toe te voegen
              // Gebruik de reeds geïmporteerde functie van bovenaan het bestand
              registerShopifyLineItemMapping(shopifyItemId, serialNumber);
              
              console.log(`🆕 Assigned new suffix ${nextSuffix} to Shopify item "${item.title}" (ID: ${shopifyItemId}) - extra mapping #${i+1}/${neededMappings}`);
              console.log(`✅ Permanent registered Shopify line item ${shopifyItemId} to serial number ${serialNumber}`);
            }
          }
        }
        
        // Update the shopify tracking in database with our current mappings
        await storage.updateShopifyTracking(existingOrderById.id, {
          orderId: existingOrderById.id,
          usedSuffixes: shopifyTracking.usedSuffixes,
          itemMappings: currentMappings
        });
        
        // STAP 2: Bepaal welke items zichtbaar moeten zijn in het systeem
        let visibleMappings = [];
        
        // Voor snellere lookups
        const shopifyItemIdToTitleMap = new Map();
        for (const item of allLineItems) {
          shopifyItemIdToTitleMap.set(String(item.id), item.title || 'Ceramic Flute');
        }
        
        // Speciale behandeling voor orders met meerdere identieke items
        // Tel hoe vaak elk itemtype voorkomt, maar beschouw items met verschillende frequenties als verschillende types
        const itemTypeCounts: Record<string, number> = {};
        
        for (const item of allLineItems) {
          // Extract specificaties om de frequency te kunnen gebruiken voor onderscheid
          const specs = extractSpecifications(item);
          const frequency = specs.frequency || specs.tuningFrequency || '440'; // Default frequency is 440Hz
          
          // Maak een unieke sleutel op basis van title EN frequency
          // Dit zorgt ervoor dat items met dezelfde title maar verschillende frequenties
          // als verschillende items worden beschouwd
          const itemType = `${item.title || 'Ceramic Flute'}_${frequency}`;
          
          console.log(`🔑 Item "${item.title}" heeft unieke sleutel: ${itemType} (inclusief frequency=${frequency})`);
          
          itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
        }
        
        // Log voor diagnostische doeleinden
        console.log(`🧮 Item type tellingen (inclusief frequency): ${JSON.stringify(itemTypeCounts)}`);
        
        // Detecteer of deze order meerdere identieke items bevat
        const hasMultipleIdenticalItems = Object.values(itemTypeCounts).some(count => count > 1);
        
        // Controleer of dit een nieuwe order is zonder bestaande items
        const isNewOrderWithoutItems = existingItems.length === 0;
        
        // BELANGRIJK: We gebruiken altijd alleen currentMappings, wat betekent
        // dat items die verwijderd zijn in Shopify NOOIT meegenomen worden in visibleMappings
        
        if (isNewOrderWithoutItems) {
          // Voor een nieuwe order zonder items importeren we ALLE HUIDIGE items, ongeacht fulfillment status
          visibleMappings = [...currentMappings];
          console.log(`Nieuwe order ${existingOrderById.orderNumber} zonder items: importeren van alle ${visibleMappings.length} items`);
        } else {
          // Voor ALLE bestaande orders, zowel met als zonder meerdere identieke items:
          // Toon alleen items die nog steeds in Shopify staan en toon alleen niet-vervulde items
          // Dit voorkomt dat verwijderde items zichtbaar blijven
          visibleMappings = currentMappings.filter(mapping => {
            // Zoek het item in de lijst van items die nog steeds in Shopify staan
            const shopifyItem = allLineItems.find(item => String(item.id) === mapping.shopifyLineItemId);
            
            // Als het item niet meer in Shopify staat, niet tonen
            if (!shopifyItem) return false;
            
            // Bij niet-identieke items ook filteren op vervuld/niet-vervuld
            if (!hasMultipleIdenticalItems) {
              return shopifyItem.fulfillable_quantity > 0; // alleen niet-vervulde items
            }
            
            // Bij identieke items tonen we ALLE items die nog in Shopify staan
            return true;
          });
          
          if (hasMultipleIdenticalItems) {
            console.log(`Order ${existingOrderById.orderNumber} bevat meerdere identieke items (${JSON.stringify(itemTypeCounts)}): behouden van ${visibleMappings.length} items die nog in Shopify staan`);
          } else {
            console.log(`Order ${existingOrderById.orderNumber} heeft ${visibleMappings.length} zichtbare items na filteren van fulfilled items`);
          }
        }
        
        // STAP 3: Maak een lijst van suffixes die moeten worden toegevoegd, bijgewerkt of verwijderd
        const suffixesToKeep = new Set(visibleMappings.map(m => m.suffix));
        const suffixesToRemove = [];
        
        for (const [suffix, existingItem] of existingItemsBySuffix.entries()) {
          if (!suffixesToKeep.has(suffix)) {
            suffixesToRemove.push(suffix);
          }
        }
        
        console.log(`Synchronisatie plan voor order ${existingOrderById.orderNumber}:`);
        console.log(`- Items om te behouden: ${Array.from(suffixesToKeep).join(', ')}`);
        console.log(`- Items om te verwijderen: ${suffixesToRemove.join(', ')}`);
        
        // STAP 4: Markeer items die niet meer zichtbaar zijn als VERWIJDERD, maar verwijder ze niet fysiek
        for (const suffix of suffixesToRemove) {
          const existingItem = existingItemsBySuffix.get(suffix);
          if (existingItem) {
            console.log(`Item ${existingItem.serialNumber} is niet meer zichtbaar (verwijderd of fulfilled) - markeren als verwijderd`);
            
            try {
              // Update item met fulfilled status en archief flag
              const updated = await storage.updateOrderItem(existingItem.id, {
                status: 'archived',
                isArchived: true,
                archivedReason: 'Automatically marked as archived during Shopify sync'
              });
              
              if (updated) {
                console.log(`✅ Item ${existingItem.serialNumber} succesvol gemarkeerd als gearchiveerd`);
              } else {
                console.error(`❌ Fout bij archiveren van item ${existingItem.serialNumber}`);
              }
            } catch (err) {
              console.error(`Error updating order item ${existingItem.id}:`, err);
            }
          }
        }
        
        // STAP 5: Voeg nieuwe items toe en update bestaande
        // Belangrijk: we moeten ALLEEN items verwerken die in suffixesToKeep zitten (visibleMappings)
        // en NIET items die in suffixesToRemove zitten (want die zijn net gearchiveerd)
        for (const mapping of visibleMappings) {
          // Haal orderNumber op zonder "SW-" prefix voor intern gebruik
          const orderNumberWithoutPrefix = existingOrderById.orderNumber.replace(/^SW-/, '');
          const serialNumber = `${orderNumberWithoutPrefix}-${mapping.suffix}`;
          const existingItem = existingItemsBySuffix.get(mapping.suffix);
          
          // Vind het bijbehorende Shopify item
          const shopifyItem = allLineItems.find(item => String(item.id) === mapping.shopifyLineItemId);
          
          // Haal specificaties op uit Shopify item door de extract functie te gebruiken
          let extractedSpecs = {};
          if (shopifyItem) {
            extractedSpecs = extractSpecifications(shopifyItem, serialNumber);
          }
          
          // Registreer de permanente koppeling in de centrale database, ook voor bestaande items
          // Dit zorgt ervoor dat de koppeling tussen shopifyLineItemId en serialNumber permanent behouden blijft
          // Gebruik de reeds geïmporteerde functie van bovenaan het bestand
          // Haal ook de specification informatie op uit het Shopify item (indien beschikbaar)
          const type = extractedSpecs['fluteType'] || extractFluteTypeFromTitle(shopifyItem?.title || '');
          const tuning = extractedSpecs['tuning'] || extractTuningFromTitle(shopifyItem?.title || '');
          const frequency = extractedSpecs['frequency'] || extractedSpecs['tuningFrequency'];
          const color = extractedSpecs['color'];
          
          registerShopifyLineItemMapping(mapping.shopifyLineItemId, serialNumber, {
            type,
            tuning,
            frequency,
            color
          });
          
          console.log(`✅ Bekrachtiging permanente koppeling: Shopify line item ${mapping.shopifyLineItemId} gekoppeld aan serienummer ${serialNumber}`);
          
          if (!shopifyItem) {
            console.warn(`⚠️ Geen Shopify item gevonden voor mapping met ID ${mapping.shopifyLineItemId} en suffix ${mapping.suffix}`);
            continue;
          }
          
          // Extra controle: als dit item in suffixesToRemove staat, sla deze over
          if (suffixesToRemove.includes(mapping.suffix)) {
            console.log(`⏭️ Item ${serialNumber} overslaan omdat het in de suffixesToRemove lijst staat`);
            continue;
          }
          
          if (!existingItem) {
            // Dit is een nieuw item dat we moeten aanmaken of een gearchiveerd item reactiveren
            console.log(`Item ${serialNumber} toevoegen of reactiveren (shopify item ID: ${mapping.shopifyLineItemId})`);
            
            try {
              // Check of het nog fulfillable is in Shopify
              const isFulfillable = shopifyItem.fulfillable_quantity > 0;
              
              // Haal specificaties op uit Shopify item door de extract functie te gebruiken
              const itemSpecs = extractSpecifications(shopifyItem, serialNumber);
              
              // Registreer de permanente koppeling in de centrale database 
              // Dit garandeert dat het serienummer permanent aan dit Shopify line item ID gekoppeld blijft
              // Gebruik de reeds geïmporteerde functie van bovenaan het bestand
              
              // Extract type and tuning information via de bestaande helper functies
              const fluteType = itemSpecs['fluteType'] || extractFluteTypeFromTitle(shopifyItem?.title || '');
              const tuning = itemSpecs['tuning'] || extractTuningFromTitle(shopifyItem?.title || '');
              const frequency = itemSpecs['frequency'] || itemSpecs['tuningFrequency'];
              const color = itemSpecs['color'];
              
              registerShopifyLineItemMapping(mapping.shopifyLineItemId, serialNumber, {
                type: fluteType,
                tuning,
                frequency,
                color
              });
              
              console.log(`✅ Permanent registered Shopify line item ${mapping.shopifyLineItemId} to serial number ${serialNumber} during item creation`);
              
              // Gebruik direct de storage functie met verbeterde reactivatie logica  
              // Natuurlijke reactivatie is nu de standaard, alleen bij bewust gearchiveerde items wordt het geblokkeerd
              const item = await storage.findOrCreateOrderItem({
                orderId: existingOrderById.id,
                serialNumber,
                itemType: mapping.title || shopifyItem.title || 'Ceramic Flute',
                status: 'ordered',
                specifications: extractSpecifications(shopifyItem),
                statusChangeDates: {},
                isArchived: false,
                archivedReason: undefined,
                shopifyLineItemId: mapping.shopifyLineItemId // Sla het shopify line item ID ook op in het item
              }, {
                // Laat de reactivatie beslissing aan de storage engine over
                // Die controleert nu of het item handmatig verwijderd is of een bekend probleemitem is
                // en zal op basis daarvan beslissen of het gereactiveerd mag worden
                forceReactivation: false
              });
              
              console.log(`✅ Item ${serialNumber} succesvol verwerkt met ID ${item.id}`);
            } catch (err) {
              console.error(`Error creating/reactivating order item ${serialNumber}:`, err);
            }
          } else {
            // Bestaand item - update alleen de specificaties en itemType indien nodig
            // Belangrijk: behoud alle bestaande checkbox data (statusChangeDates)
            console.log(`Item ${serialNumber} bijwerken met actuele gegevens uit Shopify (metadata-only update)`);
            
            try {
              // Check of het item nog steeds fulfillable is in Shopify
              // Als het nog steeds fulfillable is, reactiveren we het ongeacht het ordertype
              const isFulfillable = shopifyItem.fulfillable_quantity > 0;
              const shouldReactivate = existingItem.isArchived && isFulfillable;
              
              if (existingItem.isArchived && !shouldReactivate) {
                // Item is gearchiveerd en niet meer fulfillable in Shopify
                console.log(`⏭️ Item ${serialNumber} is gearchiveerd en niet meer fulfillable, we laten het zo - NIET reactiveren`);
                // Geen updateOrderItem aanroep hier - we laten het item gearchiveerd
              } else if (existingItem.isArchived && shouldReactivate) {
                // Reactiveer het item omdat het nog steeds fulfillable is in Shopify
                console.log(`🔄 REACTIVEREN van gearchiveerd item ${serialNumber} omdat het nog steeds fulfillable is in Shopify (quantity: ${shopifyItem.fulfillable_quantity})`);
                await storage.updateOrderItem(existingItem.id, {
                  itemType: mapping.title || shopifyItem.title || existingItem.itemType,
                  specifications: {
                    ...existingItem.specifications,
                    ...extractSpecifications(shopifyItem)
                  },
                  isArchived: false,
                  archivedReason: undefined,
                  status: 'ordered' // Reset status to ordered when reactivating
                });
              } else {
                // Normaal bijwerken
                await storage.updateOrderItem(existingItem.id, {
                  itemType: mapping.title || shopifyItem.title || existingItem.itemType,
                  specifications: {
                    ...existingItem.specifications,
                    ...extractSpecifications(shopifyItem)
                  }
                });
              }
            } catch (err) {
              console.error(`Error updating order item ${serialNumber}:`, err);
            }
          }
        }
        
        // Continue to next order as we've already processed updates
        continue;
      }
      
      // We gebruiken de eerder gegenereerde orderNumber voor consistent gedrag
      console.log(`Workshop order number: ${orderNumber}`);
      
      // Also check if order number already exists (could happen with different Shopify IDs)
      const existingOrderByNumber = await storage.getOrderByOrderNumber(orderNumber);
      if (existingOrderByNumber) {
        console.log(`Skipping order with duplicate order number: ${orderNumber}`);
        continue;
      }

      // Create a new order in our system
      const customerName = `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim() || 'Unknown Customer';
      
      // Log the Shopify order ID to debug
      console.log(`Processing Shopify order: ${shopifyOrder.id} ${typeof shopifyOrder.id}`);
      
      // Extract specifications from the first line item (for order-level specs)
      let orderSpecs = {};
      if (shopifyOrder.line_items.length > 0) {
        orderSpecs = extractSpecifications(shopifyOrder.line_items[0]);
      }
      
      // Use shipping address if available, otherwise billing address
      const shippingAddress = shopifyOrder.shipping_address || shopifyOrder.billing_address;
      
      // Check if the customer email matches any existing reseller
      const customerEmail = shopifyOrder.customer?.email || '';
      let isReseller = false;
      let resellerNickname = null;
      
      if (customerEmail) {
        try {
          // Gebruik de nieuwe intelligente detectiefunctie om reseller status te bepalen
          const resellerDetection = await storage.detectResellerFromEmail(customerEmail);
          
          // Check if resellerDetection is valid and has the expected properties
          if (resellerDetection && typeof resellerDetection === 'object' && resellerDetection.isReseller) {
            console.log(`Intelligente reseller detectie voor e-mail ${customerEmail}: gevonden reseller ${resellerDetection.resellerNickname}`);
            isReseller = true;
            resellerNickname = resellerDetection.resellerNickname;
          }
        } catch (error) {
          console.warn(`⚠️  Reseller detection failed for email ${customerEmail}:`, error.message);
          // Continue without reseller detection if it fails
        }
      }
      
      let newOrder;
      try {
        newOrder = await storage.createOrder({
          orderNumber: orderNumber,
          shopifyOrderId: shopifyOrder.id.toString(),
          customerName,
          customerEmail: shopifyOrder.customer?.email || null,
          customerPhone: shopifyOrder.customer?.phone || shippingAddress?.phone || null,
          customerAddress: shippingAddress ? 
            `${shippingAddress.address1}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}` : null,
          customerCity: shippingAddress?.city || null,
          customerState: shippingAddress?.province || null,
          customerZip: shippingAddress?.zip || null,
          customerCountry: shippingAddress?.country || null,
          orderType: isReseller ? 'reseller' : 'retail', // Set as reseller if matched
          isReseller: isReseller, // Auto-mark as reseller if matched
          resellerNickname: resellerNickname, // Set the reseller nickname from matching order
          status: 'ordered', // Initial status for new orders
          orderDate: new Date(shopifyOrder.processed_at || shopifyOrder.created_at), // Convert string to Date object
          deadline: null, // Deadline needs to be set manually
          notes: shopifyOrder.note || '',
          specifications: orderSpecs,
          statusChangeDates: {}, // Start with empty status change dates so checkboxes are unchecked by default
        });
      } catch (error) {
        console.error(`❌ Failed to create order ${orderNumber}:`, error.message);
        throw new Error(`Failed to create order: ${error.message}`);
      }
      
      // Als er een opmerking is bij de Shopify order, voeg deze toe als production note
      if (shopifyOrder.note) {
        try {
          await storage.createProductionNote({
            orderId: newOrder.id,
            note: shopifyOrder.note,
            createdBy: 'Shopify Klant',
            source: 'shopify', // Markeer deze opmerking als afkomstig van Shopify
          });
          console.log(`✅ Shopify opmerking toegevoegd als production note voor order ${newOrder.orderNumber}`);
        } catch (error) {
          console.warn(`⚠️  Failed to create production note for order ${orderNumber}:`, error.message);
          // Continue without production note if it fails
        }
      }
      
      // All line items, including fulfilled ones, for tracking purposes
      const allLineItems = shopifyOrder.line_items;
      
      // Log which items are being kept and which are filtered (for debugging)
      console.log(`Creating items for new order ${newOrder.orderNumber}: ${allLineItems.length} total items`);
      
      // Create tracking record to associate Shopify line item IDs with suffixes
      const itemMappings: Array<{shopifyLineItemId: string; suffix: number; title: string}> = [];
      const usedSuffixes: number[] = [];
      
      // Houdt bij welk suffix we als laatste hebben gebruikt
      let suffixCounter = 0;
      
      // Add mapping for each line item and create order items for ALL LINE ITEMS
      for (let i = 0; i < allLineItems.length; i++) {
        const lineItem = allLineItems[i];
        
        // Bepaal hoeveel items we moeten aanmaken voor dit line item (quantity)
        // We gebruiken hier gewoon quantity en NIET fulfillable_quantity omdat we
        // alle items willen aanmaken, ook de niet-fulfillable (die worden later gearchiveerd)
        const quantity = lineItem.quantity || 1;
        
        console.log(`Verwerken van line item "${lineItem.title}" (ID: ${lineItem.id}): quantity=${quantity}, fulfillable=${lineItem.fulfillable_quantity || 0}`);
        
        // Maak voor elke quantity een apart item aan
        for (let q = 0; q < quantity; q++) {
          suffixCounter++;
          const suffix = suffixCounter;
          
          // Record this suffix as used
          usedSuffixes.push(suffix);
          
          // Add mapping between Shopify line item ID and our suffix
          // We koppelen hetzelfde line item ID aan meerdere suffixes als quantity > 1
          itemMappings.push({
            shopifyLineItemId: String(lineItem.id),
            suffix: suffix,
            title: lineItem.title || 'Ceramic Flute'
          });
          
          // Bij nieuwe orders ook de permanente koppeling in de centrale database registreren
          // Dit zorgt ervoor dat dezelfde Shopify line item ID altijd aan hetzelfde serienummer wordt gekoppeld
          const orderNumberWithoutPrefix = orderNumber.replace(/^SW-/, '');
          const serialNumber = `${orderNumberWithoutPrefix}-${suffix}`;
          
          // Gebruik de extractSpecifications functie voor consistente extractie
          const specs = extractSpecifications(lineItem, serialNumber);
          
          // Haal de specifieke waardes er direct uit
          const fluteType = specs['fluteType'] || extractFluteTypeFromTitle(lineItem.title || '');
          const tuning = specs['tuning'] || extractTuningFromTitle(lineItem.title || '');
          const frequency = specs['frequency'] || specs['tuningFrequency']; 
          let color = specs['color'];
          if (!color && lineItem.properties) {
            const colorProp = lineItem.properties.find(p => 
              p.name.toLowerCase().includes('color')
            );
            if (colorProp) color = colorProp.value;
          }
          
          // Roep de functie aan die al geïmporteerd is bovenaan het bestand, maar nu met specificaties
          registerShopifyLineItemMapping(String(lineItem.id), serialNumber, {
            type: fluteType,
            tuning,
            frequency,
            color
          });
          
          console.log(`✅ Nieuwe permanente koppeling: Shopify line item ${lineItem.id} gekoppeld aan serienummer ${serialNumber}`);
          
          // Bij nieuwe orders importeren we ALLE items, niet alleen de fulfillable
          // Variabelen zijn al gedeclareerd, dus geen tweede declaratie nodig
          
          // Bepaal of dit item fulfillable is of niet
          // Als quantity > fulfillable_quantity, dan zijn een aantal items niet meer fulfillable
          const isItemFulfillable = q < (lineItem.fulfillable_quantity || 0);
          
          console.log(`Creating item ${serialNumber} for line item "${lineItem.title}" (ID: ${lineItem.id}, item ${q+1}/${quantity}, fulfillable: ${isItemFulfillable ? 'yes' : 'no'})`);
          
          try {
            // Gebruik de nieuwe transactionele findOrCreateOrderItem functie voor consistentie
            const item = await storage.findOrCreateOrderItem({
              orderId: newOrder.id,
              serialNumber,
              itemType: lineItem.title || 'Ceramic Flute',
              status: 'ordered',
              specifications: extractSpecifications(lineItem),
              statusChangeDates: {}, // Start with empty status change dates
              isArchived: !isItemFulfillable, // Archiveer niet-fulfillable items meteen
              archivedReason: !isItemFulfillable ? 'Automatisch gearchiveerd omdat het item al is fulfilled in Shopify' : undefined
            }, {
              // Laat de database-storage logica beslissen over reactivatie
              // Dit voorkomt onnodige reactivatie van items die bewust zijn gearchiveerd
              forceReactivation: false
            });
            console.log(`✅ Item ${serialNumber} succesvol verwerkt met ID ${item.id}`);
          } catch (err) {
            console.error(`Error creating order item ${serialNumber}:`, err);
          }
        }
      }
      
      // Store the shopify item tracking information
      try {
        await storage.createShopifyTracking({
          orderId: newOrder.id,
          usedSuffixes,
          itemMappings
        });
        
        console.log(`✅ Created shopify tracking for order ${newOrder.orderNumber} with ${itemMappings.length} mappings`);
      } catch (err) {
        console.error(`Error creating shopify tracking for order ${newOrder.orderNumber}:`, err);
      }
      
      importedOrders.push(newOrder);
    }
    
    // Update system status to completed
    systemStatus.updateSystemStatus({
      type: 'shopify_sync',
      status: 'completed',
      message: `Synchronisatie voltooid: ${importedOrders.length} orders geïmporteerd`,
      timestamp: Date.now()
    });
    
    // Maak automatisch een backup na een succesvolle synchronisatie
    console.log('Synchronisatie voltooid, planning automatische backup...');
    scheduleBackupAfterSync();
    
    return { 
      success: true, 
      message: `Imported ${importedOrders.length} new orders from Shopify`,
      importedOrders
    };
  } catch (error) {
    console.error('Error syncing Shopify orders:', error);
    
    // Update system status to failed
    const sysStatus = await import('./system-status');
    sysStatus.updateSystemStatus({
      type: 'shopify_sync',
      status: 'failed',
      message: `Synchronisatie mislukt: ${(error as Error).message}`,
      timestamp: Date.now()
    });
    
    return { 
      success: false, 
      message: `Failed to sync orders: ${(error as Error).message}`,
      importedOrders: []
    };
  }
}