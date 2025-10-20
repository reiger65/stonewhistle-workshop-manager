import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Component that shows the next instrument to build
 * Currently disabled per user request
 */
export function NextInstrumentBanner() {
  // Banner has been removed per user request
  // Instead of showing hardcoded data, just display a message that the feature is unavailable
  
  return (
    <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700 px-3 py-1.5 font-medium">
      <AlertCircle className="h-4 w-4 mr-1.5" />
      <span>Kan volgende instrument niet laden</span>
    </Badge>
  );
}