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
 */
async function fetchShopifyOrders(): Promise<ShopifyOrderResponse[]> {
  console.log(`Fetching ALL orders from Shopify API: ${SHOPIFY_API_URL}/orders.json`);
  
  try {
    // No date restriction - we need ALL historical orders 
    // This is essential for the workshop's long waitlist which can be many months
    
    // Get ALL orders to ensure we have complete data, filtering can happen in the UI
    // This ensures we don't miss any orders with multiple items or special order numbers
    
    // Use fields parameter to explicitly request fulfillment details with tracking information
    const unfulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&limit=250&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${unfulfilledData.orders.length} unfulfilled open orders from Shopify`);
    
    // We're fetching all orders in the first request now, so we can skip the next ones
    // but keeping the structure in case we need to paginate in the future
    const pendingData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?limit=0&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${pendingData.orders.length} pending unfulfilled orders from Shopify`);
    
    // Then, get partially fulfilled orders which might still be in process
    const partiallyFulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&fulfillment_status=partial&financial_status=any&limit=250&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
    ) as ShopifyOrdersResponse;
    
    console.log(`Retrieved ${partiallyFulfilledData.orders.length} partially fulfilled orders from Shopify`);
    
    // Finally, add fulfilled orders that might still be relevant to the workshop
    // REMOVED date restriction - we want ALL historical orders since the workshop has a waiting list of many months
    const fulfilledData = await shopifyApiCall(
      `${SHOPIFY_API_URL}/orders.json?status=any&fulfillment_status=fulfilled&financial_status=any&limit=250&fields=id,name,order_number,customer,shipping_address,billing_address,line_items,created_at,processed_at,note,total_price,financial_status,fulfillment_status,fulfillments`
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
 * Fetch and sync orders from Shopify
 */
export async function syncShopifyOrders() {
  try {
    console.log('Starting Shopify order sync...');
    
    // Fetch orders from Shopify API
    const shopifyOrders = await fetchShopifyOrders();
    console.log(`Retrieved ${shopifyOrders.length} orders from Shopify`);
    
    // Special diagnostic to check if we can access fulfillment data using separate API calls
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
    const updatedOrders: Order[] = [];
    
    // Process each Shopify order
    for (const shopifyOrder of shopifyOrders) {
      console.log(`Processing Shopify order #${shopifyOrder.order_number} (ID: ${shopifyOrder.id})`);
      
      // Check if the order already exists in our system by Shopify ID
      const existingOrderById = await storage.getOrderByShopifyId(shopifyOrder.id);
      
      // If the order exists, check if its status needs updating
      if (existingOrderById) {
        // Log the order status for debugging
        console.log(`Checking order ${existingOrderById.orderNumber}: Shopify fulfillment=${shopifyOrder.fulfillment_status}, financial=${shopifyOrder.financial_status}, our status=${existingOrderById.status}`);
        
        // Handle refunded or voided orders
        if (shopifyOrder.financial_status === 'refunded' || shopifyOrder.financial_status === 'voided') {
          console.log(`Order ${existingOrderById.orderNumber} has been refunded/voided in Shopify - marking as cancelled`);
          
          const updatedOrder = await storage.updateOrderStatus(existingOrderById.id, 'cancelled');
          if (updatedOrder) {
            updatedOrders.push(updatedOrder);
          }
          continue;
        }
        
        // If Shopify reports the order as fulfilled and ours is not shipping or delivered status, update it
        if (shopifyOrder.fulfillment_status === 'fulfilled' && 
           (existingOrderById.status !== 'shipping' && existingOrderById.status !== 'delivered')) {
          console.log(`Updating order ${existingOrderById.orderNumber} to appropriate delivery status as it's fulfilled in Shopify`);
          
          // Extract tracking information from the most recent fulfillment
          let trackingInfo: {
            trackingNumber: string | null;
            trackingCompany: string | null;
            trackingUrl: string | null;
            shippedDate: Date | null;
            estimatedDeliveryDate: Date | null;
            deliveryStatus?: string | null;
            deliveredDate?: Date | null;
          } = {
            trackingNumber: null,
            trackingCompany: null,
            trackingUrl: null,
            shippedDate: null,
            estimatedDeliveryDate: null,
            deliveryStatus: null,
            deliveredDate: null
          };
          
          // Fetch fulfillment data directly using separate API call
          const fulfillments = await fetchFulfillmentData(shopifyOrder.id);
          
          if (fulfillments.length > 0) {
            // Get the most recent fulfillment
            const latestFulfillment = fulfillments.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            
            // Print the raw fulfillment from Shopify for debugging
            console.log(`✉️ FULL FULFILLMENT DATA for order ${existingOrderById.orderNumber}:`, JSON.stringify(latestFulfillment, null, 2));
            
            // Print the fulfillment details for debugging
            console.log(`📦 Fulfillment details for order ${existingOrderById.orderNumber}:`, {
              id: latestFulfillment.id,
              status: latestFulfillment.status,
              tracking_number: latestFulfillment.tracking_number,
              tracking_company: latestFulfillment.tracking_company,
              tracking_url: latestFulfillment.tracking_url,
              created_at: latestFulfillment.created_at,
              updated_at: latestFulfillment.updated_at
            });
            
            // Extract delivery status - default to 'shipped' when we know it's fulfilled
            let deliveryStatus = 'shipped';
            let deliveredDate = null;
            
            // Check if fulfillment status indicates delivered
            if (latestFulfillment.status === 'delivered' || latestFulfillment.status === 'success') {
              deliveryStatus = 'delivered';
              // Use updated_at if we don't have a better timestamp
              deliveredDate = new Date(latestFulfillment.updated_at);
            }
            
            // For certain shipping carriers where we know the pattern, try to determine delivery status
            if (latestFulfillment.tracking_company && !deliveredDate) {
              // Check if it's a tracking number format we can use for delivery time estimation
              const trackingNumber = latestFulfillment.tracking_number;
              
              // Calculate days since shipped for probable delivery status
              const shippedDate = new Date(latestFulfillment.created_at);
              const today = new Date();
              const daysSinceShipped = Math.ceil(
                (today.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              // Simulate different shipping states based on how long ago the order was shipped
              // Shipping process:
              // 1. Processing (0-1 days)
              // 2. In Transit (1-6 days for EU, 1-10 for international)
              // 3. Out for Delivery (6-7 days for EU, 10-14 for international)
              // 4. Delivered (after 7 days for EU, after 14 for international)
              
              // For common EU carriers, use more precise delivery status
              const europeanCarriers = ['postNL', 'post nl', 'postnl', 'dhl', 'dpd', 'gls', 'bpost', 'colissimo'];
              const isEuropeanCarrier = europeanCarriers.some(carrier => 
                latestFulfillment.tracking_company.toLowerCase().includes(carrier.toLowerCase())
              );
              
              if (isEuropeanCarrier) {
                if (daysSinceShipped <= 1) {
                  deliveryStatus = 'processing';
                } else if (daysSinceShipped <= 5) {
                  deliveryStatus = 'in_transit';
                } else if (daysSinceShipped <= 7) {
                  deliveryStatus = 'out_for_delivery';
                } else {
                  deliveryStatus = 'delivered';
                  deliveredDate = new Date(shippedDate);
                  deliveredDate.setDate(deliveredDate.getDate() + 7);
                }
              } else {
                // For international shipments
                if (daysSinceShipped <= 2) {
                  deliveryStatus = 'processing';
                } else if (daysSinceShipped <= 10) {
                  deliveryStatus = 'in_transit';
                } else if (daysSinceShipped <= 14) {
                  deliveryStatus = 'out_for_delivery';
                } else {
                  deliveryStatus = 'delivered';
                  deliveredDate = new Date(shippedDate);
                  deliveredDate.setDate(deliveredDate.getDate() + 14);
                }
              }
            }
            
            // Build tracking info object with all the details
            trackingInfo = {
              trackingNumber: latestFulfillment.tracking_number || null,
              trackingCompany: latestFulfillment.tracking_company || null,
              trackingUrl: latestFulfillment.tracking_url || null,
              shippedDate: latestFulfillment.created_at ? new Date(latestFulfillment.created_at) : null,
              estimatedDeliveryDate: latestFulfillment.estimated_delivery_at ? new Date(latestFulfillment.estimated_delivery_at) : null,
              deliveryStatus,
              deliveredDate
            };
            
            console.log(`Found tracking info for order ${existingOrderById.orderNumber}: ${trackingInfo.trackingNumber} (${trackingInfo.trackingCompany}) - Status: ${deliveryStatus}`);
          }
          
          // Set order status to 'delivered' if confirmed delivered, otherwise keep as 'shipping'
          let orderStatus = 'shipping';
          if (trackingInfo.deliveryStatus === 'delivered') {
            orderStatus = 'delivered';
          }
          
          // Update the order with tracking info and appropriate status
          const updatedOrder = await storage.updateOrder(existingOrderById.id, {
            status: orderStatus,
            ...trackingInfo
          });
          
          if (updatedOrder) {
            updatedOrders.push(updatedOrder);
          }
        }
        
        // Update existing shipping orders with more accurate delivery status
        else if (existingOrderById.status === 'shipping' && 
                shopifyOrder.fulfillment_status === 'fulfilled') {
          
          // Fetch fulfillment data directly using a separate API call
          const fulfillments = await fetchFulfillmentData(shopifyOrder.id);
          
          if (fulfillments.length === 0) {
            console.log(`No fulfillments found for order ${existingOrderById.orderNumber} - skipping update`);
            continue;
          }
          
          // Get the most recent fulfillment
          const latestFulfillment = fulfillments.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          // Print the raw fulfillment from Shopify for debugging
          console.log(`✉️ [Existing Order] FULL FULFILLMENT DATA for order ${existingOrderById.orderNumber}:`, JSON.stringify(latestFulfillment, null, 2));
          
          // Print the fulfillment details for debugging
          console.log(`📦 [Existing Order] Fulfillment details for order ${existingOrderById.orderNumber}:`, {
            id: latestFulfillment.id,
            status: latestFulfillment.status,
            tracking_number: latestFulfillment.tracking_number,
            tracking_company: latestFulfillment.tracking_company,
            tracking_url: latestFulfillment.tracking_url,
            created_at: latestFulfillment.created_at,
            updated_at: latestFulfillment.updated_at
          });
          
          // Skip if no tracking info or this order was already updated recently
          if (!latestFulfillment.tracking_number) {
            console.log(`No tracking number found for order ${existingOrderById.orderNumber} - skipping update`);
            continue;
          }
          
          let deliveryStatus = existingOrderById.deliveryStatus || 'shipped';
          let deliveredDate = existingOrderById.deliveredDate || null;
          
          // Calculate days since shipped for determining status
          const shippedDate = existingOrderById.shippedDate 
            ? new Date(existingOrderById.shippedDate) 
            : new Date(latestFulfillment.created_at);
          
          const today = new Date();
          const daysSinceShipped = Math.ceil(
            (today.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // For common EU carriers, determine current status
          const europeanCarriers = ['postNL', 'post nl', 'postnl', 'dhl', 'dpd', 'gls', 'bpost', 'colissimo'];
          const isEuropeanCarrier = europeanCarriers.some(carrier => 
            (latestFulfillment.tracking_company || '').toLowerCase().includes(carrier.toLowerCase()) ||
            (existingOrderById.trackingCompany || '').toLowerCase().includes(carrier.toLowerCase())
          );
          
          // Update delivery status based on days since shipped and carrier type
          if (isEuropeanCarrier) {
            if (daysSinceShipped <= 1) {
              deliveryStatus = 'processing';
            } else if (daysSinceShipped <= 5) {
              deliveryStatus = 'in_transit';
            } else if (daysSinceShipped <= 7) {
              deliveryStatus = 'out_for_delivery';
            } else {
              deliveryStatus = 'delivered';
              deliveredDate = deliveredDate || new Date(shippedDate);
              deliveredDate.setDate(deliveredDate.getDate() + 7);
            }
          } else {
            // For international shipments
            if (daysSinceShipped <= 2) {
              deliveryStatus = 'processing';
            } else if (daysSinceShipped <= 10) {
              deliveryStatus = 'in_transit';
            } else if (daysSinceShipped <= 14) {
              deliveryStatus = 'out_for_delivery';
            } else {
              deliveryStatus = 'delivered';
              deliveredDate = deliveredDate || new Date(shippedDate);
              deliveredDate.setDate(deliveredDate.getDate() + 14);
            }
          }
          
          // Only update if the delivery status has changed
          if (deliveryStatus !== existingOrderById.deliveryStatus) {
            console.log(`Updating delivery status for order ${existingOrderById.orderNumber}: ${existingOrderById.deliveryStatus || 'unknown'} -> ${deliveryStatus}`);
            
            // Set order status to 'delivered' if confirmed delivered
            const orderStatus = deliveryStatus === 'delivered' ? 'delivered' : 'shipping';
            
            // Make sure to update tracking information on each update as well
            const updateData = {
              status: orderStatus,
              deliveryStatus,
              deliveredDate: deliveryStatus === 'delivered' ? deliveredDate : null,
              // Add tracking info if we still don't have it
              trackingNumber: existingOrderById.trackingNumber || latestFulfillment.tracking_number || null,
              trackingCompany: existingOrderById.trackingCompany || latestFulfillment.tracking_company || null,
              trackingUrl: existingOrderById.trackingUrl || latestFulfillment.tracking_url || null
            };
            
            console.log(`Updating order ${existingOrderById.orderNumber} with tracking info:`, {
              trackingNumber: updateData.trackingNumber,
              trackingCompany: updateData.trackingCompany
            });
            
            const updatedOrder = await storage.updateOrder(existingOrderById.id, updateData);
            
            if (updatedOrder) {
              updatedOrders.push(updatedOrder);
            }
          }
        } 
        // Special case for orders that might not have their fulfillment status properly set
        else if (shopifyOrder.financial_status === 'paid' && 
                 (existingOrderById.status !== 'shipping' && existingOrderById.status !== 'delivered')) {
          console.log(`Order ${existingOrderById.orderNumber} is paid but not marked as shipped - checking if it's an older order that needs updating`);
          
          // IMPORTANT: Only mark orders as shipping if they are fulfilled in Shopify
          // Do NOT change order status from "ordered" to "shipping" unless explicitly fulfilled in Shopify
          // This prevents orders from disappearing from the buildlist prematurely
          
          // For orders that are paid, fulfilled, and older than 6 months (180 days), assume they should be shipped
          const orderDate = new Date(shopifyOrder.processed_at || shopifyOrder.created_at);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
          
          if (shopifyOrder.fulfillment_status === 'fulfilled' && orderDate < sixMonthsAgo) {
            console.log(`Order ${existingOrderById.orderNumber} is over 6 months old, paid and FULFILLED - marking as shipping`);
            const updatedOrder = await storage.updateOrderStatus(existingOrderById.id, 'shipping');
            if (updatedOrder) {
              updatedOrders.push(updatedOrder);
            }
          } else {
            console.log(`Keeping order ${existingOrderById.orderNumber} in current status (${existingOrderById.status}) as it is not fulfilled in Shopify`);
          }
        }
        // Also check for orders that are in shipping status but should be marked as delivered
        else if (existingOrderById.status === 'shipping' && existingOrderById.shippedDate) {
          // Determine how many days ago the order was shipped
          const shippedDate = new Date(existingOrderById.shippedDate);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - shippedDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // If order was shipped over 14 days ago, mark it as delivered
          if (diffDays > 14 && !existingOrderById.deliveredDate) {
            console.log(`Order ${existingOrderById.orderNumber} was shipped ${diffDays} days ago - marking as delivered`);
            
            const updatedOrder = await storage.updateOrder(existingOrderById.id, {
              status: 'delivered',
              deliveryStatus: 'delivered',
              deliveredDate: new Date()
            });
            
            if (updatedOrder) {
              updatedOrders.push(updatedOrder);
            }
          }
        }
        
        // If order exists but there might be new line items, check for that
        // This ensures we don't miss multi-item orders that were only partially imported
        if (shopifyOrder.line_items.length > 1) {
          console.log(`Existing order ${existingOrderById.orderNumber} has ${shopifyOrder.line_items.length} line items - checking for missing items`);
          
          // Get existing order items
          const existingItems = await storage.getOrderItems(existingOrderById.id);
          
          // Check if we have fewer items than we should
          if (existingItems.length < shopifyOrder.line_items.length) {
            console.log(`Order ${existingOrderById.orderNumber} has ${existingItems.length} items in our DB but ${shopifyOrder.line_items.length} in Shopify - adding missing items`);
            
            // Find the next item index (max existing + 1)
            const maxItemIndex = existingItems.reduce((max, item) => {
              const itemIndex = parseInt(item.serialNumber.split('-')[1]);
              return itemIndex > max ? itemIndex : max;
            }, 0);
            
            // Add missing items
            for (let i = existingItems.length; i < shopifyOrder.line_items.length; i++) {
              const lineItem = shopifyOrder.line_items[i];
              const serialNumber = `${existingOrderById.orderNumber}-${maxItemIndex + i - existingItems.length + 1}`;
              
              console.log(`Adding missing item ${serialNumber} to order ${existingOrderById.orderNumber}`);
              
              await storage.createOrderItem({
                orderId: existingOrderById.id,
                serialNumber,
                itemType: lineItem.title || 'Ceramic Flute',
                status: 'ordered', // Just use 'ordered' to prevent type errors
                specifications: extractSpecifications(lineItem),
                statusChangeDates: {}, // Start with empty status change dates
              });
            }
          }
        }
        
        // Continue to next order as we've already processed updates
        continue;
      }
      
      // Generate an order number using the last 4 digits of the Shopify order number (not ID)
      const orderNumber = `SW-${String(shopifyOrder.order_number).slice(-4)}`;
      console.log(`Generated workshop order number: ${orderNumber}`);
      
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
      
      const newOrder = await storage.createOrder({
        orderNumber: orderNumber,
        shopifyOrderId: shopifyOrder.id,
        customerName,
        customerEmail: shopifyOrder.customer?.email || null,
        customerPhone: shopifyOrder.customer?.phone || shippingAddress?.phone || null,
        customerAddress: shippingAddress ? 
          `${shippingAddress.address1}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}` : null,
        customerCity: shippingAddress?.city || null,
        customerState: shippingAddress?.province || null,
        customerZip: shippingAddress?.zip || null,
        customerCountry: shippingAddress?.country || null,
        orderType: 'retail', // Default to retail for Shopify orders
        status: 'ordered', // Initial status for new orders
        orderDate: new Date(shopifyOrder.processed_at || shopifyOrder.created_at), // Convert string to Date object
        deadline: null, // Deadline needs to be set manually
        notes: shopifyOrder.note || '',
        specifications: orderSpecs,
        statusChangeDates: {}, // Start with empty status change dates so checkboxes are unchecked by default
      });
      
      // Create order items for each line item
      for (let i = 0; i < shopifyOrder.line_items.length; i++) {
        const lineItem = shopifyOrder.line_items[i];
        const serialNumber = `${newOrder.orderNumber}-${i + 1}`;
        
        await storage.createOrderItem({
          orderId: newOrder.id,
          serialNumber,
          itemType: lineItem.title || 'Ceramic Flute',
          status: 'ordered', // Initialize with 'ordered' but don't set the statusChangeDate
          specifications: extractSpecifications(lineItem),
          statusChangeDates: {}, // Start with empty status change dates so checkboxes are unchecked by default
        });
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