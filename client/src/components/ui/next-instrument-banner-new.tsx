import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Construction, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNextNotStartedItem } from '@/hooks/use-next-not-started-item';

// Debug all not-started items on load
console.log("Loading NextInstrumentBanner component with updated filter logic");

/**
 * Component that shows the next instrument to build
 * Uses direct client-side filtering to match the worksheet logic exactly
 */
export function NextInstrumentBanner() {
  const queryClient = useQueryClient();
  
  // Use the client-side filtering hook for not-started items
  const { 
    notStartedItems,
    nextItem,
    isLoading,
    error,
    notStartedCount
  } = useNextNotStartedItem();
  
  // Debug any errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching items:", error);
    }
  }, [error]);

  // Auto-refresh data every 10 minutes to reduce data costs
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing item data");
      // Invalidate the order items query so all components stay in sync
      queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }, 600000); // 10 minutes (600000ms) - maximum cost effectiveness
    
    return () => clearInterval(interval);
  }, [queryClient]);
  
  // Use state to track when data is stable
  const [dataStable, setDataStable] = useState(false);
  
  // Wait for data to be stable with real results
  useEffect(() => {
    if (!isLoading && notStartedItems?.length > 0) {
      console.log("BANNER: Setting data stable flag - items fully loaded");
      const timer = setTimeout(() => setDataStable(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, notStartedItems]);
  
  // Show loading state - show for both initial loading AND until data is stable
  if (isLoading || !dataStable) {
    return (
      <Badge 
        variant="outline" 
        className="h-7 rounded-md shadow-sm bg-white text-blue-700 border border-blue-300 px-2 py-1 font-medium text-xs whitespace-nowrap"
      >
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        <span className="font-condensed text-[13px]">Loading...</span>
      </Badge>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Badge 
        variant="outline" 
        className="h-7 rounded-md shadow-sm bg-white text-yellow-700 border border-yellow-300 px-2 py-1 font-medium text-xs whitespace-nowrap"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        <span className="font-condensed text-[13px]">Error</span>
      </Badge>
    );
  }
  
  // Show empty state when no instruments need building
  if (!notStartedItems || notStartedItems.length === 0 || !nextItem) {
    return (
      <Badge 
        variant="outline" 
        className="h-7 rounded-md shadow-sm bg-white text-green-700 border border-green-300 px-2 py-1 font-medium text-xs whitespace-nowrap"
      >
        <CheckCircle2 className="h-3 w-3 mr-1" />
        <span className="font-condensed text-[13px]">All built</span>
      </Badge>
    );
  }
  
  // Extract order number for display
  let orderNumber = '';
  
  if (nextItem && nextItem.orderNumber) {
    // Get the order number without the "SW-" prefix
    orderNumber = nextItem.orderNumber.replace(/^SW-/, '');
  } else if (nextItem && nextItem.serialNumber) {
    // Try to extract from serialNumber format (typically "1234-1")
    const matches = nextItem.serialNumber.match(/^(\d+)-/);
    if (matches && matches[1]) {
      orderNumber = matches[1];
    }
  }
  
  return (
    <Badge 
      variant="outline" 
      className="h-7 rounded-md shadow-sm bg-white hover:bg-[#F5F5F0] text-[#059669] border border-[#059669] px-2 py-1 font-medium text-xs whitespace-nowrap"
    >
      <Construction className="h-3 w-3 mr-1" />
      <span className="font-condensed text-[13px]">next {orderNumber || ""}</span>
    </Badge>
  );
}