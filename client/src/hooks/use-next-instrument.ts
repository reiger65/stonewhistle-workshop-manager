import { useQuery } from '@tanstack/react-query';

// Type for order item
interface OrderItem {
  id: number;
  orderId: number;
  serialNumber: string;
  status: string;
  itemName: string;
  orderNumber: string;
  archived: boolean;
  checkboxes: Record<string, boolean>;
}

// Hook to find the next instrument to build
export function useNextInstrument() {
  const { data: orderItems, isLoading, error } = useQuery<OrderItem[], Error>({
    queryKey: ['/api/order-items'],
    // Simple fetch function that returns JSON
    queryFn: async () => {
      const response = await fetch('/api/order-items');
      if (!response.ok) {
        throw new Error('Failed to fetch order items');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Log the number of order items being processed
  console.log('Processing order items:', orderItems?.length || 0);

  // Display the first 5 order items for debugging
  if (orderItems && orderItems.length > 0) {
    orderItems.slice(0, 5).forEach((item, index) => {
      console.log(`Item ${index + 1}:`, item.orderNumber, item.serialNumber, 
        'archived:', item.archived, 
        'status:', item.status,
        'ordered:', item.checkboxes?.ordered,
        'building:', item.checkboxes?.building);
    });
  }

  // Create a robust filter for items that have only the ordered checkbox checked
  const notStartedItems = orderItems?.filter(item => {
    // Skip archived items
    if (item.archived || item.status === 'archived') return false;
    
    // Skip items without checkboxes
    if (!item.checkboxes) return false;
    
    // Must have ordered checked
    if (!item.checkboxes.ordered) return false;
    
    // Skip if building checkbox is already checked
    if (item.checkboxes.building) return false;
    
    // Skip if "validated" is checked - this means it's already been processed
    if (item.checkboxes.validated) return false;
    
    // Count how many checkboxes are checked
    const checkedCount = Object.values(item.checkboxes).filter(Boolean).length;
    
    // If only 'ordered' is checked (total count = 1), this is a not-started item
    return checkedCount === 1;
  });
  
  // Show a debug message with the found items
  if (notStartedItems && notStartedItems.length > 0) {
    console.log('Not started items:');
    notStartedItems.forEach(item => {
      console.log(`- ${item.orderNumber}/${item.serialNumber}: ${JSON.stringify(item.checkboxes)}`);
    });
  } else {
    console.log('No not-started items found');
  }
  
  // Sort by order number (assuming lower numbers come first)
  const sortedItems = notStartedItems?.sort((a, b) => {
    const aNum = parseInt(a.orderNumber.replace(/\D/g, ''));
    const bNum = parseInt(b.orderNumber.replace(/\D/g, ''));
    return aNum - bNum;
  });
  
  // Take the first item as the next instrument to build
  const nextInstrument = sortedItems?.[0];
  
  // If we found an item, log it and return it
  if (nextInstrument) {
    console.log("Found first not started item:", nextInstrument.orderNumber, nextInstrument.serialNumber);
  } else {
    console.log("No not-started items found, trying to use first ordered item with minimal checkboxes");
    
    // Smarter fallback - find ordered items that aren't archived and have the least number of checkboxes checked
    // This prioritizes items that are earlier in the production process
    const fallbackItems = orderItems
      ?.filter(item => 
        !item.archived && 
        item.status !== 'archived' &&
        item.checkboxes?.ordered === true &&
        !item.checkboxes?.building  // Skip already building items
      )
      // Sort first by checkbox count (fewer is better), then by order number
      ?.sort((a, b) => {
        // Count checked checkboxes for each item
        const aCheckedCount = Object.values(a.checkboxes).filter(Boolean).length;
        const bCheckedCount = Object.values(b.checkboxes).filter(Boolean).length;
        
        // First sort by number of checkboxes (fewer first)
        if (aCheckedCount !== bCheckedCount) {
          return aCheckedCount - bCheckedCount;
        }
        
        // Then by order number (lower first)
        const aNum = parseInt(a.orderNumber.replace(/\D/g, ''));
        const bNum = parseInt(b.orderNumber.replace(/\D/g, ''));
        return aNum - bNum;
      });
    
    // Use first fallback item if available
    if (fallbackItems && fallbackItems.length > 0) {
      console.log("Using fallback item:", fallbackItems[0].orderNumber, fallbackItems[0].serialNumber);
      return {
        nextInstrument: fallbackItems[0],
        isLoading, 
        error
      };
    }
  }
  
  // Add debug information to console
  console.log('Next instrument to build:', nextInstrument ? 
    `${nextInstrument.orderNumber}/${nextInstrument.serialNumber}` : 'Nothing to build');

  return {
    nextInstrument,
    isLoading,
    error
  };
}