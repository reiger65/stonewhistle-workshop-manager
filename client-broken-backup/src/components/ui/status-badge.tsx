import React from 'react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { getStatusColorClass, getStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

export function StatusBadge({ status, className, showLabel = true }: StatusBadgeProps) {
  const colorClass = getStatusColorClass(status);
  const label = getStatusLabel(status);
  
  return (
    <Badge 
      className={cn(
        colorClass,
        "px-2 py-1 rounded text-xs font-medium",
        className
      )}
    >
      {showLabel ? label : ""}
    </Badge>
  );
}

export function OrderTypeBadge({ type, className }: { type?: string, className?: string }) {
  // Safety check for undefined type
  if (!type) {
    return (
      <Badge 
        className={cn(
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          "px-2 py-1 rounded text-xs font-medium",
          className
        )}
      >
        Unknown
      </Badge>
    );
  }

  const getTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'retail':
        return 'bg-primary/10 text-primary';
      case 'reseller':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'custom':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  const typeClass = getTypeClass(type);
  
  return (
    <Badge 
      className={cn(
        typeClass,
        "px-2 py-1 rounded text-xs font-medium",
        className
      )}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}
