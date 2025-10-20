import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface OrderItem {
  id: number;
  orderId: number;
  serialNumber: string;
  status: string;
  itemName: string;
  orderNumber: string;
  archived: boolean;
  isArchived?: boolean;
  checkboxes?: Record<string, boolean>;
  statusChangeDates?: Record<string, string>;
  tuning?: string;
  specifications?: Record<string, string>;
}

interface Order {
  id: number;
  orderNumber: string;
  shopifyOrderId: string;
  status: string;
  archived: boolean;
  isArchived?: boolean;
}

/**
 * Custom hook that calculates the true not-started items count that should match
 * the worksheet filter logic exactly
 */
export function useClientNotStartedItems() {
  // Get all items
  const { 
    data: allItems,
    isLoading: itemsLoading, 
    error: itemsError
  } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items'],
    staleTime: 30000, // 30 seconds
  });
  
  // Get all orders
  const { 
    data: allOrders,
    isLoading: ordersLoading, 
    error: ordersError
  } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    staleTime: 30000, // 30 seconds
  });
  
  // Process and filter items client-side to match the worksheet logic exactly
  const notStartedItems = useMemo(() => {
    if (!allItems || !allOrders) return [];
    
    console.log("CLIENT HOOK: Using the exact same not_started filter logic as the worksheet");
    
    // Count all items for debugging
    let totalItems = 0;
    let nonArchivedItems = 0;
    let itemsWithNoCheckboxes = 0;
    
    // We need to find items without any checkboxes checked
    // Exactly matching the worksheet's not_started filter logic
    const filteredItems = allItems.filter(item => {
      totalItems++;
      
      // Skip archived items
      if (item.archived || item.isArchived || item.status === 'archived') return false;
      nonArchivedItems++;
      
      // Get checkbox data - this is critical to match the worksheet logic exactly
      const checkboxes = item.checkboxes || {};
      
      // EXACT MATCH TO BOTH WORKSHEET AND SERVER LOGIC: 
      // Check if statusChangeDates is empty (no dates = not started)
      const statusDates = item.statusChangeDates || {};
      const hasNoStatusDates = Object.keys(statusDates).length === 0;
      
      if (hasNoStatusDates) {
        // No status dates - this is a not-started item
        itemsWithNoCheckboxes++;
        console.log(`CLIENT - NOT-STARTED FOUND: ${item.serialNumber} (Order ${item.orderNumber})`);
        return true;
      }
      
      return false;
    });
    
    // Sort by order number to find the oldest orders first
    const sortedItems = [...filteredItems].sort((a, b) => {
      const aNum = parseInt(String(a.orderNumber || a.serialNumber || "").replace(/\D/g, '') || '0');
      const bNum = parseInt(String(b.orderNumber || b.serialNumber || "").replace(/\D/g, '') || '0');
      return aNum - bNum;
    });
    
    // Log summary of what we found
    console.log(`CLIENT HOOK: Not-started filter found ${sortedItems.length} items (from ${totalItems} total, ${nonArchivedItems} non-archived, ${itemsWithNoCheckboxes} with no checkboxes)`);
    
    // Add debug info about what items were found
    if (sortedItems.length > 0) {
      console.log(`CLIENT HOOK: The 5 oldest not-started items:`);
      sortedItems.slice(0, 5).forEach(item => {
        console.log(`  - ${item.serialNumber} (Order ${item.orderNumber})`);
      });
    }
    
    return sortedItems;
  }, [allItems, allOrders]);
  
  return {
    notStartedItems,
    count: notStartedItems.length,
    isLoading: itemsLoading || ordersLoading,
    error: itemsError || ordersError
  };
}

/**
 * Original hook that fetches only "not started" items from API endpoint
 * Keep this for compatibility while we transition to the client-side implementation
 */
export function useNotStartedItems() {
  return useQuery<OrderItem[], Error>({
    queryKey: ['/api/not-started-items'],
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });
}