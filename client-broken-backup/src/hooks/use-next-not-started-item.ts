import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface OrderItem {
  id: number;
  orderId: number;
  serialNumber?: string;
  status?: string;
  itemName?: string;
  orderNumber?: string;
  archived?: boolean;
  isArchived?: boolean;
  checkboxes?: Record<string, boolean>;
  statusChangeDates?: Record<string, string>;
  itemType?: string;
  tuning?: string;
  specifications?: Record<string, string>;
}

interface Order {
  id: number;
  orderNumber?: string;
  status?: string;
  isArchived?: boolean;
  archived?: boolean;
}

/**
 * Direct client-side filtering implementation
 * This avoids the API endpoint and filters the data immediately on the client
 */
export function useNextNotStartedItem() {
  // Fetch all order items directly 
  const { 
    data: allItems,
    isLoading: itemsLoading,
    error: itemsError
  } = useQuery<OrderItem[]>({
    queryKey: ['/api/items'],
    staleTime: 30000, // 30 seconds
  });
  
  // We also need all orders to check parent order status
  const { 
    data: allOrders,
    isLoading: ordersLoading,
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    staleTime: 30000, // 30 seconds
  });
  
  // Filter the items client-side to match the worksheet logic exactly
  const { notStartedItems, nextItem } = useMemo(() => {
    if (!allItems || !allOrders) return { notStartedItems: [], nextItem: null };
    
    console.log('--- Direct Client Filter For Not Started Items ---');
    
    // Count all items for debugging
    let totalItems = 0;
    let nonArchivedItems = 0;
    let notStartedItems = 0;
    let itemsByOrderNumber = new Map(); // To count unique order numbers
    
    // Filter for items with order numbers >= 1500 and no status dates
    const filteredItems = allItems.filter(item => {
      totalItems++;
      
      // Skip archived items (EXACT MATCH TO WORKSHEET LOGIC)
      if (item.isArchived || item.status === 'archived') return false;
      
      nonArchivedItems++;
      
      // Get order number to check if it's >= 1500
      let orderNum = 0;
      if (item.orderNumber) {
        const matches = item.orderNumber.match(/(\d+)/);
        if (matches && matches[1]) {
          orderNum = parseInt(matches[1]);
        }
      } else if (item.serialNumber) {
        // Try to extract from serial number
        const matches = item.serialNumber.match(/^(\d+)-/);
        if (matches && matches[1]) {
          orderNum = parseInt(matches[1]);
        }
      }
      
      // Critical check: order number >= 1500
      if (orderNum < 1500) return false;
      
      // Check if item has no production processes started
      const statusDates = item.statusChangeDates || {};
      
      // Define production statuses - any of these indicate the item has been started (EXACT MATCH TO WORKSHEET LOGIC)
      const productionStatuses = [
        'building', 'build', 'dry', 'terrasigillata', 'firing', 
        'smokefiring', 'smoothing', 'tuning1', 'waxing', 'tuning2',
        'ordered', 'validated' // Database field names for 'parts' and 'prepared' checkboxes
      ];
      
      // Check if NONE of the production statuses exist in the item's status dates
      const hasNoProductionStatus = !productionStatuses.some(
        status => statusDates[status]
      );
      
      if (hasNoProductionStatus) {
        // No production statuses - this is a not-started item
        notStartedItems++;
        
        // Count by order number for debug
        if (!itemsByOrderNumber.has(orderNum)) {
          itemsByOrderNumber.set(orderNum, 1);
        } else {
          itemsByOrderNumber.set(orderNum, itemsByOrderNumber.get(orderNum) + 1);
        }
        
        // Debug log critical cases
        if (orderNum >= 1535 && orderNum <= 1540) {
          console.log(`CLIENT FILTER DEBUG: Order ${orderNum} Item ${item.serialNumber} is NOT STARTED`);
          console.log(`  Status dates:`, Object.keys(statusDates));
        }
        return true;
      }
      
      return false;
    });
    
    // Sort by order number (ascending) to get the oldest orders first
    const sortedItems = [...filteredItems].sort((a, b) => {
      const aNum = parseInt(String(a.orderNumber || a.serialNumber || "").replace(/\D/g, '') || '0');
      const bNum = parseInt(String(b.orderNumber || b.serialNumber || "").replace(/\D/g, '') || '0');
      return aNum - bNum;
    });
    
    // Print detailed debug information
    console.log(`CLIENT FILTER: Found ${sortedItems.length} not-started items`);
    console.log(`CLIENT FILTER: Processed ${totalItems} items (${nonArchivedItems} non-archived, ${notStartedItems} not-started)`);
    
    // Print breakdown by order number
    const orderEntries = Array.from(itemsByOrderNumber.entries())
      .sort((a, b) => a[0] - b[0]);
    console.log(`CLIENT FILTER: Items per order number:`);
    orderEntries.forEach(([orderNum, count]) => {
      console.log(`- Order #${orderNum}: ${count} items`);
    });
    
    // Get the next item (first in sorted list)
    const nextItem = sortedItems.length > 0 ? sortedItems[0] : null;
    
    // Special debug for critical orders
    if (sortedItems.length > 0) {
      console.log('CLIENT FILTER: First 5 not-started items:');
      sortedItems.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i+1}. ${item.serialNumber} (${item.orderNumber})`);
      });
    }
    
    return { notStartedItems: sortedItems, nextItem };
  }, [allItems, allOrders]);
  
  // Debug the next item if we have one
  if (nextItem) {
    console.log('CLIENT FILTER - Next item:', nextItem.serialNumber, nextItem.orderNumber);
  }
  
  return {
    nextItem,
    notStartedItems,
    isLoading: itemsLoading || ordersLoading,
    error: itemsError || ordersError,
    notStartedCount: notStartedItems.length
  };
}