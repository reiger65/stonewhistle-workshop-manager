import React from 'react';
import { useNextNotStartedItem } from '@/hooks/use-next-not-started-item'; 
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';

/**
 * Component that shows the total count of not-started items
 * Uses direct client-side filtering instead of API endpoint for better results
 */
export function NotStartedItemsCount() {
  // We use the same client-side filtering hook that was just implemented
  const { notStartedCount, isLoading, error } = useNextNotStartedItem(); 
  
  // Show loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-2 py-1 font-medium text-xs whitespace-nowrap h-7">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        <span>Loading...</span>
      </Badge>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 px-2 py-1 font-medium text-xs whitespace-nowrap h-7">
        <span>Error</span>
      </Badge>
    );
  }
  
  // Show the count using the client-side filter results
  return (
    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800 px-2 py-1 font-medium text-xs whitespace-nowrap h-7">
      <Package className="h-3 w-3 mr-1" />
      <span>To build: {notStartedCount}</span>
    </Badge>
  );
}