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

  // Create a simple filter for items that have only the ordered checkbox checked
  const notStartedItems = orderItems?.filter(item => {
    // Skip archived items
    if (item.archived || item.status === 'archived') return false;
    
    // Skip items without checkboxes
    if (!item.checkboxes) return false;
    
    // Must have ordered checked
    if (!item.checkboxes.ordered) return false;
    
    // Check if any checkboxes other than 'ordered' are checked
    for (const [key, value] of Object.entries(item.checkboxes)) {
      if (key !== 'ordered' && value === true) {
        return false; // This item has some other checkbox checked
      }
    }
    
    // If we get here, only 'ordered' is checked
    return true;
  });
  
  // Sort by order number (ascending)
  const nextItems = notStartedItems?.sort((a, b) => {
    const aNum = parseInt(a.orderNumber.replace(/\D/g, ''));
    const bNum = parseInt(b.orderNumber.replace(/\D/g, ''));
    return aNum - bNum;
  });
  
  // Get the first item (lowest order number)
  const nextInstrument = nextItems?.[0];
  
  if (nextInstrument) {
    console.log("Found next instrument to build:", nextInstrument.orderNumber, nextInstrument.serialNumber);
  } else {
    console.log("No instrument found with only 'ordered' checkbox");
  }

  return {
    nextInstrument,
    isLoading,
    error
  };
}