// Shopify API integration with direct fetch approach
import { Order } from '@shared/schema';
import { storage } from './storage';
import { format, parse } from 'date-fns';
import fetch from 'node-fetch';

// Shopify API constants
const API_VERSION = '2023-10';
// Use the domain provided by the user directly
const SHOPIFY_DOMAIN = 'stonewhistle.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

// Base Shopify API URL
const SHOPIFY_API_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}`;

console.log(`Configured Shopify API URL: ${SHOPIFY_API_URL} with token: ${ACCESS_TOKEN ? 'Present' : 'Missing'}`);

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
 */
export function generateOrderNumber(shopifyOrderId: string | number): string {
  // Convert to string first, then use slice
  const idString = String(shopifyOrderId);
  return `SW-${idString.slice(-4)}`;
}

/**
 * Extract specifications from Shopify line item properties
 */
export function extractSpecifications(lineItem: ShopifyOrderResponse['line_items'][0]): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Extract from title (usually contains instrument type and note)
  if (lineItem.title) {
    // Store the full title as type
    specs['type'] = lineItem.title;
    
    // Try to extract instrument model from title
    if (lineItem.title.toLowerCase().includes('innato')) {
      specs['model'] = 'INNATO';
    } else if (lineItem.title.toLowerCase().includes('natey')) {
      specs['model'] = 'NATEY';
    } else if (lineItem.title.toLowerCase().includes('double')) {
      specs['model'] = 'DOUBLE';
    } else if (lineItem.title.toLowerCase().includes('zen')) {
      specs['model'] = 'ZEN';
    }
    
    // Try to extract tuning frequency from title
    if (lineItem.title.includes('432')) {
      specs['tuningFrequency'] = '432Hz';
    } else if (lineItem.title.includes('440')) {
      specs['tuningFrequency'] = '440Hz';
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
      }
      if (propNameLower.includes('type') || propNameLower.includes('model')) {
        specs['type'] = prop.value;
      }
    });
  }

  // Add SKU if available
  if (lineItem.sku) {
    specs['SKU'] = lineItem.sku;
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
  // Bepaal de datum 6 maanden geleden als er geen specifieke startdatum is opgegeven
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();
  
  // Gebruik de opgegeven startdatum of standaard 6 maanden terug
  const dateFilter = startDate || sixMonthsAgoISO;
  
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
 * Fetch and sync orders from Shopify
 * @param {string} [period] - Optional period to limit the sync ("1month", "3months", "6months", "1year", "all")
 */
export async function syncShopifyOrders(period?: string): Promise<any> {
  try {
    console.log(`Starting Shopify order sync with period: ${period || '6 months (default)'}`);
    
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
        console.log(`⏭️ Skipping fully fulfilled order ${orderNumber} - no synchronization needed`);
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
          // Gebruik de slimme reseller detectie functie
          const resellerDetection = await storage.detectResellerFromEmail(customerEmail);
          
          if (resellerDetection.isReseller) {
            console.log(`🔄 Reseller detectie voor bestaande order ${existingOrderById.orderNumber}: e-mail ${customerEmail} matcht met reseller ${resellerDetection.resellerNickname}`);
            
            // Update de order met de juiste reseller gegevens
            await storage.updateOrder(existingOrderById.id, {
              isReseller: true,
              resellerNickname: resellerDetection.resellerNickname,
              orderType: 'reseller'
            });
            
            console.log(`✅ Order ${existingOrderById.orderNumber} bijgewerkt met reseller nickname: ${resellerDetection.resellerNickname}`);
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
        const existingItemsBySuffix = new Map();
        for (const item of existingItems) {
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
        
        // Vind nieuwe items die nog geen mapping hebben
        const existingMappedIds = new Set(currentMappings.map(mapping => String(mapping.shopifyLineItemId)));
        const newShopifyItems = allLineItems.filter(item => 
          !existingMappedIds.has(String(item.id))
        );
        
        // Wijs nieuwe suffixes toe aan nieuwe items
        for (const newItem of newShopifyItems) {
          // Find next available suffix
          let nextSuffix = 1;
          while (shopifyTracking.usedSuffixes.includes(nextSuffix)) {
            nextSuffix++;
          }
          
          // Add to used suffixes
          shopifyTracking.usedSuffixes.push(nextSuffix);
          
          // Create new mapping
          currentMappings.push({
            shopifyLineItemId: String(newItem.id),
            suffix: nextSuffix,
            title: newItem.title || 'Ceramic Flute'
          });
          
          console.log(`🆕 Assigned new suffix ${nextSuffix} to Shopify item "${newItem.title}" (ID: ${newItem.id})`);
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
        // Tel hoe vaak elk itemtype voorkomt
        const itemTypeCounts: Record<string, number> = {};
        for (const item of allLineItems) {
          const itemType = item.title || 'Ceramic Flute';
          itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
        }
        
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
        } else if (hasMultipleIdenticalItems) {
          // Bij orders met meerdere identieke items nemen we alleen items mee die NOG STEEDS in Shopify staan
          // Dit voorkomt dat verwijderde items zichtbaar blijven
          visibleMappings = [...currentMappings];
          console.log(`Order ${existingOrderById.orderNumber} bevat meerdere identieke items (${JSON.stringify(itemTypeCounts)}): behouden van ${visibleMappings.length} items die nog in Shopify staan`);
        } else {
          // Voor bestaande reguliere orders tonen we alleen items die nog in Shopify staan EN niet-vervuld zijn
          visibleMappings = currentMappings.filter(mapping => {
            const shopifyItem = fulfillableLineItems.find(item => String(item.id) === mapping.shopifyLineItemId);
            return !!shopifyItem; // alleen mappings voor nog te vervullen items
          });
          
          console.log(`Order ${existingOrderById.orderNumber} heeft ${visibleMappings.length} zichtbare items na filteren van fulfilled items`);
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
        for (const mapping of visibleMappings) {
          const serialNumber = `${existingOrderById.orderNumber}-${mapping.suffix}`;
          const existingItem = existingItemsBySuffix.get(mapping.suffix);
          
          // Vind het bijbehorende Shopify item
          const shopifyItem = allLineItems.find(item => String(item.id) === mapping.shopifyLineItemId);
          
          if (!shopifyItem) {
            console.warn(`⚠️ Geen Shopify item gevonden voor mapping met ID ${mapping.shopifyLineItemId} en suffix ${mapping.suffix}`);
            continue;
          }
          
          if (!existingItem) {
            // Dit is een nieuw item dat we moeten aanmaken of een gearchiveerd item reactiveren
            console.log(`Item ${serialNumber} toevoegen of reactiveren (shopify item ID: ${mapping.shopifyLineItemId})`);
            
            try {
              // Gebruik de nieuwe transactionele findOrCreateOrderItem functie om race conditions te voorkomen
              const item = await storage.findOrCreateOrderItem({
                orderId: existingOrderById.id,
                serialNumber,
                itemType: mapping.title || shopifyItem.title || 'Ceramic Flute',
                status: 'ordered',
                specifications: extractSpecifications(shopifyItem),
                statusChangeDates: {},
                isArchived: false,
                archivedReason: null
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
              // Controleer of het item gearchiveerd is, zo ja dan reactiveren
              if (existingItem.isArchived) {
                console.log(`🔄 Item ${serialNumber} is gearchiveerd, reactiveren`);
                
                await storage.updateOrderItem(existingItem.id, {
                  isArchived: false,
                  status: 'ordered',
                  archivedReason: null,
                  itemType: mapping.title || shopifyItem.title || existingItem.itemType,
                  specifications: {
                    ...existingItem.specifications,
                    ...extractSpecifications(shopifyItem)
                  }
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
        // Gebruik de nieuwe intelligente detectiefunctie om reseller status te bepalen
        const resellerDetection = await storage.detectResellerFromEmail(customerEmail);
        
        if (resellerDetection.isReseller) {
          console.log(`Intelligente reseller detectie voor e-mail ${customerEmail}: gevonden reseller ${resellerDetection.resellerNickname}`);
          isReseller = true;
          resellerNickname = resellerDetection.resellerNickname;
        }
      }
      
      const newOrder = await storage.createOrder({
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
      
      // Als er een opmerking is bij de Shopify order, voeg deze toe als production note
      if (shopifyOrder.note) {
        await storage.createProductionNote({
          orderId: newOrder.id,
          note: shopifyOrder.note,
          createdBy: 'Shopify Klant',
          source: 'shopify', // Markeer deze opmerking als afkomstig van Shopify
        });
        console.log(`✅ Shopify opmerking toegevoegd als production note voor order ${newOrder.orderNumber}`);
      }
      
      // All line items, including fulfilled ones, for tracking purposes
      const allLineItems = shopifyOrder.line_items;
      
      // Log which items are being kept and which are filtered (for debugging)
      console.log(`Creating items for new order ${newOrder.orderNumber}: ${allLineItems.length} total items`);
      
      // Create tracking record to associate Shopify line item IDs with suffixes
      const itemMappings: Array<{shopifyLineItemId: string; suffix: number; title: string}> = [];
      const usedSuffixes: number[] = [];
      
      // Add mapping for each line item and create order items for ALL LINE ITEMS
      for (let i = 0; i < allLineItems.length; i++) {
        const lineItem = allLineItems[i];
        const suffix = i + 1;  // Start suffixes at 1
        
        // Record this suffix as used
        usedSuffixes.push(suffix);
        
        // Add mapping between Shopify line item ID and our suffix
        itemMappings.push({
          shopifyLineItemId: String(lineItem.id),
          suffix: suffix,
          title: lineItem.title || 'Ceramic Flute'
        });
        
        // Bij nieuwe orders importeren we ALLE items, niet alleen de fulfillable
        const serialNumber = `${newOrder.orderNumber}-${suffix}`;
        
        console.log(`Creating item ${serialNumber} for line item "${lineItem.title}" (ID: ${lineItem.id}, fulfillable: ${lineItem.fulfillable_quantity > 0 ? 'yes' : 'no'})`);
        
        try {
          // Gebruik de nieuwe transactionele findOrCreateOrderItem functie voor consistentie
          const item = await storage.findOrCreateOrderItem({
            orderId: newOrder.id,
            serialNumber,
            itemType: lineItem.title || 'Ceramic Flute',
            status: 'ordered',
            specifications: extractSpecifications(lineItem),
            statusChangeDates: {}, // Start with empty status change dates
            isArchived: false,     // Nieuwe items zijn nooit gearchiveerd
            archivedReason: null   // Geen reden voor archivering
          });
          console.log(`✅ Item ${serialNumber} succesvol verwerkt met ID ${item.id}`);
        } catch (err) {
          console.error(`Error creating order item ${serialNumber}:`, err);
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
    
    return { 
      success: true, 
      message: `Imported ${importedOrders.length} new orders from Shopify`,
      importedOrders
    };
  } catch (error) {
    console.error('Error syncing Shopify orders:', error);
    return { 
      success: false, 
      message: `Failed to sync orders: ${(error as Error).message}`,
      importedOrders: []
    };
  }
}