/**
 * EMERGENCY FIX FOR ORDER 1542 A3 TUNING FILTERING
 * This file contains a specialized filter that ensures only 5 specific items
 * from order 1542 are displayed when A3 tuning filter is active
 */

/**
 * ABSOLUTE CRITICAL A3 FILTER - MUST BE USED FOR ALL A3 TUNING FILTERING
 * 
 * Checks if an item from order 1542 should be shown when A3 filter is active
 * For 1542, only items with suffixes 1, 8, 15, 22, and 29 should be shown
 * For all other orders, this filter always returns true (pass-through)
 * 
 * @param serialNumber The serial number to check
 * @returns boolean True if the item should be shown, false if it should be hidden
 */
export function shouldShowForA3Filter(serialNumber: string | undefined | null): boolean {
  console.log(`🚨 EMERGENCY A3 FILTER CHECK for ${serialNumber || 'unknown'}`);
  
  if (!serialNumber) {
    console.log(`❌ EMERGENCY A3 FILTER: No serial number provided, item hidden`);
    return false;
  }
  
  // If this is not an order 1542 item, allow it (will be filtered by normal tuning filters)
  if (!serialNumber.startsWith('1542-')) {
    console.log(`✅ EMERGENCY A3 FILTER: Non-1542 item ${serialNumber} allowed`);
    return true;
  }
  
  // For 1542 items, ONLY allow the 5 specific serial numbers
  const suffix = parseInt(serialNumber.replace('1542-', ''));
  const allowedA3Items = [1, 8, 15, 22, 29];
  
  const result = allowedA3Items.includes(suffix);
  console.log(`🔴 EMERGENCY A3 FILTER: Item ${serialNumber} suffix=${suffix} is ${result ? 'ALLOWED' : 'FILTERED OUT'}`);
  
  return result;
}

/**
 * SPECIAL HARDCODED ALLOWED SERIALS FOR ORDER 1542 A3 FILTER
 * These serial numbers are the only ones that should be visible when A3 filter is active
 */
export const ALLOWED_1542_A3_SERIALS = ['1542-1', '1542-8', '1542-15', '1542-22', '1542-29'];

/**
 * Direct function to check if a serial number is in the allowed list for 1542 A3 filtering
 */
export function isAllowed1542A3Serial(serialNumber: string | undefined | null): boolean {
  if (!serialNumber) return false;
  return ALLOWED_1542_A3_SERIALS.includes(serialNumber);
}