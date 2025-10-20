import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

/**
 * Combines class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd/MM/yy'); // Shorter format that fits on one line
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Get color class based on order type
 */
export function getOrderTypeColorClass(orderType: string): string {
  switch (orderType) {
    case 'retail':
      return 'bg-primary/10 text-primary';
    case 'reseller':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'custom':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

/**
 * Get status label based on Excel workflow
 */
export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    ordered: 'Parts Build',       // O
    validated: 'Part Together',   // V
    building: 'Build & Drying',   // BUILD
    testing: 'Decoration Ready',  // TS
    firing: 'Fire',               // 🔥
    smoothing: 'Smoke Fire',      // SM
    tuning1: 'First Tuning',      // T1
    waxing: 'Waxing',             // WAX
    tuning2: 'Second Tuning',     // T2
    bagging: 'Bagged',            // BAG
    boxing: 'Packed',             // BOX
    labeling: 'Label',            // LAB
    shipping: 'Shipping',         // 📩
    delivered: 'Delivered',       // ➡️
    cancelled: 'Cancelled'        // ❌
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get color class based on status from Excel workflow
 */
export function getStatusColorClass(status: string): string {
  const statusColorMap: Record<string, string> = {
    ordered: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    validated: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    building: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    testing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    firing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    smoothing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    tuning1: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    waxing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    tuning2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    bagging: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    boxing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    labeling: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    shipping: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  
  return statusColorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

/**
 * Get icon or symbol for status based on Excel workflow
 */
export function getStatusIcon(status: string): string {
  const statusIconMap: Record<string, string> = {
    ordered: 'Parts',          // ClipboardList
    validated: 'Prepared',     // CheckSquare
    building: 'BUILD',         // Hammer
    testing: 'TS',             // Music
    firing: '🔥',              // Flame
    smoothing: 'SM',           // Sandpaper
    tuning1: 'T1',             // MusicNote
    waxing: 'WAX',             // Droplet
    tuning2: 'T2',             // MusicNote
    bagging: 'BAG',            // ShoppingBag
    boxing: 'BOX',             // Package
    labeling: 'LAB',           // Tag
    shipping: '📩',            // Send
    delivered: '➡️',           // CheckCircle
    cancelled: '❌'            // XCircle
  };
  
  return statusIconMap[status] || 'help_outline';
}

/**
 * Get deadline status class
 */
export function getDeadlineClass(deadline: string | Date | null | undefined): string {
  if (!deadline) return 'text-gray-500';
  
  try {
    const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'text-red-600 font-medium';
    } else if (diffDays <= 3) {
      return 'text-accent font-medium';
    } else if (diffDays <= 7) {
      return 'text-yellow-600 font-medium';
    } else {
      return 'text-secondary font-medium';
    }
  } catch (error) {
    return 'text-gray-500';
  }
}

/**
 * Normalize instrument type for consistent usage across the app
 */
export function getNormalizedInstrumentType(instrumentType: string): string {
  // Convert to uppercase and remove any spaces or special characters
  const normalized = instrumentType.toUpperCase().trim();
  
  // Map variations to standardized names
  const typeMap: Record<string, string> = {
    'INNATO': 'INNATO',
    'NATEY': 'NATEY',
    'DOUBLE': 'DOUBLE',
    'ZEN': 'ZEN',
    'INNATA': 'INNATO',
    'NATY': 'NATEY'
  };
  
  return typeMap[normalized] || normalized;
}

/**
 * Calculate average wait time from completed orders
 * @param orders - Array of all orders
 * @param options - Options for calculation
 * @returns Number of days average wait time
 */
export function calculateAverageWaitTime(
  orders: any[],
  options: {
    includeStatuses?: string[],
    startDate?: Date | string | null,
    maxWaitDays?: number,
    trimOutliers?: boolean
  } = {}
): number {
  const {
    includeStatuses = ['shipping', 'delivered', 'completed'],
    startDate = null,
    maxWaitDays = 150,
    trimOutliers = true
  } = options;
  
  // Filter completed orders with valid dates
  const completedOrders = orders.filter(order => {
    // Check if order has a valid status
    if (!includeStatuses.includes(order.status)) return false;
    
    // Check if order has valid dates
    if (!order.orderDate) return false;
    if (!order.shippedDate && !order.updatedAt && !order.deliveredDate) return false;
    
    // If startDate is provided, filter orders after that date
    if (startDate) {
      const orderDate = new Date(order.orderDate);
      const compareDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
      if (orderDate < compareDate) return false;
    }
    
    return true;
  });
  
  // If no completed orders, return default value
  if (completedOrders.length === 0) {
    console.log("calculateAverageWaitTime: Geen voltooide orders gevonden, gebruik fallback naar 90 dagen");
    return 90; // Consistent met de 90 dagen standaard waarde in reports.tsx
  }
  
  // Calculate wait times for all completed orders
  const waitTimes = completedOrders.map(order => {
    const orderDate = new Date(order.orderDate);
    const completionDate = order.shippedDate ? new Date(order.shippedDate) : 
                          order.deliveredDate ? new Date(order.deliveredDate) : 
                          new Date(order.updatedAt);
    
    // Calculate wait time in days, cap at maximum
    const waitDays = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (waitDays < 0) return maxWaitDays; // Skip negative wait times by using max
    return Math.min(waitDays, maxWaitDays);
  });
  
  // If we want to trim outliers and have enough data points
  if (trimOutliers && waitTimes.length > 2) {
    // Sort wait times and remove shortest and longest values
    const sortedTimes = [...waitTimes].sort((a, b) => a - b);
    const trimmedTimes = sortedTimes.slice(1, sortedTimes.length - 1);
    
    // Calculate average of remaining values
    const sum = trimmedTimes.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / trimmedTimes.length);
  } else {
    // Calculate simple average
    const sum = waitTimes.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / waitTimes.length);
  }
}
