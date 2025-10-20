import { Order, OrderItem } from '@shared/schema';

/**
 * Utility functions for generating chart and report data
 */

interface ColorData {
  name: string;
  value: number;
  fill: string;
  code: string;
}

interface TypeData {
  name: string;
  value: number;
  fill: string;
}

interface TuningData {
  name: string;
  value: number;
  fill: string;
}

interface LocationData {
  country: string;
  value: number;
  fill: string;
  states?: Record<string, number>;
}

export const instrumentColors = {
  INNATO: '#818cf8', // indigo
  NATEY: '#fbbf24',  // amber
  DOUBLE: '#a855f7', // purple
  ZEN: '#2dd4bf',    // teal
  OVA: '#ec4899',    // pink
  CARDS: '#f43f5e'   // rose
};

export const flutesColorMap = {
  'B': '#4a63ee',   // Blue 
  'SB': '#374fc8',  // Smokefired Blue
  'T': '#a16c56',   // Smokefired Terra (tiger)
  'TB': '#c26e50',  // Smokefired Terra & Bronze
  'C': '#3b3330',   // Smokefired Black & Copper
  'DEFAULT': '#94a3b8' // Default gray
};

/**
 * Generate instrument type distribution data
 */
export function generateInstrumentTypeData(orders: Order[], orderItems: OrderItem[]): TypeData[] {
  const typeCounts: Record<string, number> = {
    'INNATO': 0,
    'NATEY': 0,
    'DOUBLE': 0,
    'ZEN': 0,
    'OVA': 0,
    'CARDS': 0,
    'OTHER': 0
  };
  
  // First count by order items
  orderItems.forEach(item => {
    let type = 'OTHER';
    
    // Safely handle specifications
    if (item.specifications && typeof item.specifications === 'object') {
      const specs = item.specifications as Record<string, unknown>;
      if ('type' in specs && typeof specs.type === 'string') {
        type = getInstrumentType(specs.type);
      }
    }
    // Try title field next
    else if (item.title && typeof item.title === 'string') {
      type = getInstrumentType(item.title);
    }
    
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  // If no order items, fall back to order data 
  if (orderItems.length === 0) {
    orders.forEach(order => {
      let type = 'OTHER';
      
      // Safely handle specifications
      if (order.specifications && typeof order.specifications === 'object') {
        const specs = order.specifications as Record<string, unknown>;
        if ('type' in specs && typeof specs.type === 'string') {
          type = getInstrumentType(specs.type);
        }
      } 
      // Try title field next
      else if (order.title && typeof order.title === 'string') {
        type = getInstrumentType(order.title);
      }
      
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
  }
  
  // Convert to chart data format
  return Object.entries(typeCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: type,
      value: count,
      fill: instrumentColors[type as keyof typeof instrumentColors] || '#94a3b8'
    }));
}

/**
 * Generate color distribution data
 */
export function generateColorData(orders: Order[], orderItems: OrderItem[]): ColorData[] {
  const colorCounts: Record<string, number> = {};
  const colorCodes: Record<string, string> = {
    'Smokefired Black with Terra and Copper Bubbles': 'C',
    'Smokefired Terra and Black': 'T',
    'Smokefired Blue with Terra/Gold Bubbles': 'SB',
    'Blue with Terra and Gold Bubbles': 'B',
    'Smokefired Terra with Terra and Bronze Bubbles': 'TB'
  };
  
  // First count by order items
  orderItems.forEach(item => {
    let color = 'Other';
    
    // Safely handle specifications
    if (item.specifications && typeof item.specifications === 'object') {
      const specs = item.specifications as Record<string, unknown>;
      if ('color' in specs && typeof specs.color === 'string') {
        color = specs.color;
      }
    }
    
    // Fallback to item.color if available
    if (color === 'Other' && item.color && typeof item.color === 'string') {
      color = item.color;
    }
    
    // Standardize color names - all operations below are safe since we established color is a string
    if (color.toLowerCase().includes('terra and black')) {
      color = 'Smokefired Terra and Black';
    } else if (color.toLowerCase().includes('black') && color.toLowerCase().includes('copper')) {
      color = 'Smokefired Black with Terra and Copper Bubbles';
    } else if (color.toLowerCase().includes('blue') && color.toLowerCase().includes('smoke')) {
      color = 'Smokefired Blue with Terra/Gold Bubbles';
    } else if (color.toLowerCase().includes('blue')) {
      color = 'Blue with Terra and Gold Bubbles';
    } else if (color.toLowerCase().includes('terra') && color.toLowerCase().includes('bronze')) {
      color = 'Smokefired Terra with Terra and Bronze Bubbles';
    }
    
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  // If no order items, fall back to order data
  if (orderItems.length === 0) {
    orders.forEach(order => {
      let color = 'Other';
      
      // Safely handle specifications
      if (order.specifications && typeof order.specifications === 'object') {
        const specs = order.specifications as Record<string, unknown>;
        if ('color' in specs && typeof specs.color === 'string') {
          color = specs.color;
        }
      }
      
      // Fallback to order.color if available
      if (color === 'Other' && order.color && typeof order.color === 'string') {
        color = order.color;
      }
      
      // Standardize color names
      if (color.toLowerCase().includes('terra and black')) {
        color = 'Smokefired Terra and Black';
      } else if (color.toLowerCase().includes('black') && color.toLowerCase().includes('copper')) {
        color = 'Smokefired Black with Terra and Copper Bubbles';
      } else if (color.toLowerCase().includes('blue') && color.toLowerCase().includes('smoke')) {
        color = 'Smokefired Blue with Terra/Gold Bubbles';
      } else if (color.toLowerCase().includes('blue')) {
        color = 'Blue with Terra and Gold Bubbles';
      } else if (color.toLowerCase().includes('terra') && color.toLowerCase().includes('bronze')) {
        color = 'Smokefired Terra with Terra and Bronze Bubbles';
      }
      
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
  }
  
  // Convert to chart data format
  return Object.entries(colorCounts)
    .filter(([_, count]) => count > 0)
    .map(([color, count]) => {
      const code = colorCodes[color] || 'DEFAULT';
      return {
        name: color,
        value: count,
        fill: flutesColorMap[code as keyof typeof flutesColorMap] || '#94a3b8',
        code: code
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * Generate tuning distribution data
 */
export function generateTuningData(orders: Order[], orderItems: OrderItem[]): TuningData[] {
  const tuningCounts: Record<string, number> = {};
  
  // First count by order items
  orderItems.forEach(item => {
    let tuning = 'Unknown';
    
    // Safely handle specifications
    if (item.specifications && typeof item.specifications === 'object') {
      const specs = item.specifications as Record<string, unknown>;
      if ('note' in specs && typeof specs.note === 'string') {
        tuning = standardizeTuning(specs.note);
      } else if ('tuning' in specs && typeof specs.tuning === 'string') {
        tuning = standardizeTuning(specs.tuning);
      }
    }
    
    // Fallback to item.tuning if available
    if (tuning === 'Unknown' && item.tuning && typeof item.tuning === 'string') {
      tuning = standardizeTuning(item.tuning);
    }
    
    tuningCounts[tuning] = (tuningCounts[tuning] || 0) + 1;
  });
  
  // If no order items, fall back to order data
  if (orderItems.length === 0) {
    orders.forEach(order => {
      let tuning = 'Unknown';
      
      // Safely handle specifications
      if (order.specifications && typeof order.specifications === 'object') {
        const specs = order.specifications as Record<string, unknown>;
        if ('note' in specs && typeof specs.note === 'string') {
          tuning = standardizeTuning(specs.note);
        } else if ('tuning' in specs && typeof specs.tuning === 'string') {
          tuning = standardizeTuning(specs.tuning);
        }
      }
      
      // Fallback to order.tuning if available
      if (tuning === 'Unknown' && order.tuning && typeof order.tuning === 'string') {
        tuning = standardizeTuning(order.tuning);
      }
      
      tuningCounts[tuning] = (tuningCounts[tuning] || 0) + 1;
    });
  }
  
  // Generate colors for each tuning
  const tuningEntries = Object.entries(tuningCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  // Create a color spectrum for the tunings
  const generateTuningColor = (index: number, total: number) => {
    // Generate a color from blue to red spectrum based on position
    const hue = Math.floor(240 - (index / Math.max(1, total - 1)) * 240);
    return `hsl(${hue}, 70%, 60%)`;
  };
  
  return tuningEntries.map(([tuning, count], index) => ({
    name: tuning,
    value: count,
    fill: generateTuningColor(index, tuningEntries.length)
  }));
}

/**
 * Generate location distribution data
 */
export function generateLocationData(orders: Order[]): LocationData[] {
  const countryCounts: Record<string, number> = {};
  const statesByCountry: Record<string, Record<string, number>> = {};
  
  orders.forEach(order => {
    if (!order.shippingAddress) return;
    
    const country = order.shippingAddress.country || 'Unknown';
    const state = order.shippingAddress.province || 'Unknown';
    
    // Count countries
    countryCounts[country] = (countryCounts[country] || 0) + 1;
    
    // Count states within countries
    if (!statesByCountry[country]) {
      statesByCountry[country] = {};
    }
    statesByCountry[country][state] = (statesByCountry[country][state] || 0) + 1;
  });
  
  // Generate colors for each country
  const countryEntries = Object.entries(countryCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  // Create a color spectrum for the countries
  const generateCountryColor = (index: number, total: number) => {
    // Generate a color from green to yellow spectrum based on position
    const hue = Math.floor(120 - (index / Math.max(1, total - 1)) * 60);
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  return countryEntries.map(([country, count], index) => ({
    country,
    value: count,
    fill: generateCountryColor(index, countryEntries.length),
    states: statesByCountry[country]
  }));
}

/**
 * Generate monthly trend data
 */
export function generateMonthlyTrendData(orders: Order[]): any[] {
  // Start specifically from July 23, 2023 as requested
  const earliestDate = new Date("2023-07-23");
  const currentDate = new Date();
  
  // Round down to the first day of the month for both dates
  const startMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  const endMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Create an array of all months between start and end
  const monthsData: any[] = [];
  let currentMonth = new Date(startMonth);
  
  while (currentMonth <= endMonth) {
    const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentMonth.toLocaleString('default', { month: 'short' });
    const year = currentMonth.getFullYear();
    
    monthsData.push({
      month: yearMonth,
      name: `${monthName} ${year}`,
      displayName: monthName,
      year: year,
      INNATO: 0,
      NATEY: 0,
      DOUBLE: 0,
      ZEN: 0,
      OVA: 0,
      CARDS: 0,
      total: 0
    });
    
    // Move to next month
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  // Count orders by month and type
  orders.forEach(order => {
    if (!order.orderDate) return;
    
    const orderDate = new Date(order.orderDate);
    const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthData = monthsData.find(m => m.month === orderMonth);
    if (!monthData) return;
    
    // Determine the instrument type
    let type = 'OTHER';
    
    // Safely handle specifications
    if (order.specifications && typeof order.specifications === 'object') {
      const specs = order.specifications as Record<string, unknown>;
      if ('type' in specs && typeof specs.type === 'string') {
        type = getInstrumentType(specs.type);
      }
    } 
    // Try title field next
    else if (order.title && typeof order.title === 'string') {
      type = getInstrumentType(order.title);
    }
    
    // Increment the count for this type and the total
    if (monthData[type] !== undefined) {
      monthData[type] += 1;
    }
    monthData.total += 1;
  });
  
  // Return only months with data
  return monthsData.filter(m => m.total > 0);
}

/**
 * Get standardized instrument type
 */
function getInstrumentType(typeString: string): string {
  const upperType = typeString.toUpperCase();
  
  if (upperType.includes('INNATO')) return 'INNATO';
  if (upperType.includes('NATEY')) return 'NATEY';
  if (upperType.includes('DOUBLE')) return 'DOUBLE';
  if (upperType.includes('ZEN')) return 'ZEN';
  if (upperType.includes('OVA')) return 'OVA';
  
  // Special case for CARDS vs INNATO
  if ((upperType.includes('CARDS') || upperType.includes('KAART')) &&
      !upperType.includes('INNATO')) {
    return 'CARDS';
  }
  
  // If type has INNATO but also includes card, it's an INNATO
  if (upperType.includes('INNATO')) {
    return 'INNATO';
  }
  
  return 'OTHER';
}

/**
 * Standardize tuning notations
 */
function standardizeTuning(note: string): string {
  if (!note) return 'Unknown';
  
  // Handle "NATEY Dm4" format
  if (note.includes('NATEY') || note.includes('Natey')) {
    const dmMatch = note.match(/([A-G][#b]?)m?(\d)/i);
    if (dmMatch) {
      const [_, notePart, octave] = dmMatch;
      return `${notePart.toUpperCase()}${octave}`;
    }
  }
  
  // Handle INNATO Dm4 format
  if (note.includes('INNATO') || note.includes('Innato')) {
    const dmMatch = note.match(/([A-G][#b]?)m?(\d)/i);
    if (dmMatch) {
      const [_, notePart, octave] = dmMatch;
      return `${notePart.toUpperCase()}${octave}`;
    }
  }
  
  // Handle special formats like "Cm4" (C minor 4th octave)
  const minorMatch = note.match(/([A-G][#b]?)m(\d)/i);
  if (minorMatch) {
    const [_, notePart, octave] = minorMatch;
    return `${notePart.toUpperCase()}${octave}`;
  }
  
  // Handle standard format like "F#3" (F sharp 3rd octave)
  const standardMatch = note.match(/([A-G][#b]?)(\d)/i);
  if (standardMatch) {
    const [_, notePart, octave] = standardMatch;
    return `${notePart.toUpperCase()}${octave}`;
  }
  
  // For anything else, just return what we have
  return note;
}