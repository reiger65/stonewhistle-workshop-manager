import { apiRequest } from "./queryClient";

// This is a mock service for the Shopify integration
// In a real implementation, this would interact with the Shopify API directly

export interface ShopifyOrder {
  id: string;
  order_number: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: Array<{
    id: string;
    title: string;
    variant_title: string;
    properties: Array<{ name: string; value: string }>;
    quantity: number;
  }>;
  created_at: string;
  processed_at: string;
  note: string;
}

/**
 * Sync orders from Shopify API
 */
export async function syncShopifyOrders(): Promise<{ 
  message: string;
  importedCount?: number;
  importedOrders?: any[];
  success?: boolean;
}> {
  try {
    const response = await apiRequest('POST', '/api/import-shopify', {});
    const data = await response.json();
    return { 
      message: data.message,
      importedCount: data.importedCount,
      importedOrders: data.importedOrders,
      success: true
    };
  } catch (error) {
    console.error('Failed to sync Shopify orders:', error);
    return { 
      message: `Failed to sync orders: ${(error as Error).message}`,
      success: false
    };
  }
}

/**
 * Convert Shopify date format to readable date
 */
export function formatShopifyDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

/**
 * Extract specifications from Shopify line item properties
 */
export function extractSpecifications(lineItem: ShopifyOrder['line_items'][0]): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Extract from variant title (e.g. "Blue / D / Engraved")
  if (lineItem.variant_title) {
    const variantParts = lineItem.variant_title.split(' / ');
    if (variantParts.length >= 1) specs['Color'] = variantParts[0];
    if (variantParts.length >= 2) specs['Key'] = variantParts[1];
    if (variantParts.length >= 3) specs['Engraving'] = variantParts[2] === 'Engraved' ? 'Yes' : 'No';
  }
  
  // Extract from line item properties
  if (lineItem.properties) {
    lineItem.properties.forEach(prop => {
      specs[prop.name] = prop.value;
    });
  }
  
  return specs;
}

/**
 * Generate a workshop order number from Shopify order
 */
export function generateOrderNumber(shopifyOrderId: string): string {
  return `SW-${shopifyOrderId.slice(-4)}`;
}
