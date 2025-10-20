/**
 * Shared color detection utilities for Stonewhistle flute color codes
 * 
 * Color Code Meanings:
 * - B: Blue (not smoke-fired)
 * - SB: Smokefired Blue  
 * - T: Smokefired Terra and Black (tiger stripe)
 * - TB: Smokefired Terra with Bronze Bubbles
 * - C: Smokefired Black with Copper Bubbles
 */

/**
 * Detects color code from item specifications
 * Works with both full specification objects and color strings
 */
export function getColorCodeFromSpecifications(specifications?: Record<string, any> | string, instrumentType?: string): string {
  // Handle string input (legacy support)
  if (typeof specifications === 'string') {
    return detectColorCodeFromString(specifications);
  }
  
  // Handle object specifications
  if (specifications && typeof specifications === 'object') {
    const spec = specifications.specifications || specifications;
    const specString = JSON.stringify(spec).toLowerCase();
    
    // Check for smokefired colors first (more specific)
    
    // SB: Smokefired Blue (various patterns)
    if (specString.includes('smokefired blue')) {
      return 'SB';
    }
    
    // TB: Smokefired Terra with Bronze Bubbles (various patterns)
    if (specString.includes('smokefired terra with') && specString.includes('bronze bubbles')) {
      return 'TB';
    }
    
    // T: Smokefired Terra and Black (tiger stripe)
    if (specString.includes('smokefired terra') && specString.includes('black')) {
      return 'T';
    }
    
    // C: Smokefired Black with Copper Bubbles (various patterns)
    if (specString.includes('smokefired black') && specString.includes('copper bubbles')) {
      return 'C';
    }
    
    // B: Regular Blue (not smokefired, various patterns)
    if (specString.includes('blue') && !specString.includes('smokefired')) {
      return 'B';
    }
  }
  
  // Fallback to instrument type if no specifications available
  if (instrumentType) {
    return getColorCodeFromInstrumentType(instrumentType);
  }
  
  return '';
}

/**
 * Detects color code from a color description string
 */
export function detectColorCodeFromString(fullColor: string | undefined): string {
  if (!fullColor) return '';
  
  const lowerColor = fullColor.toLowerCase();
  
  // Handle specific known color combinations
  if (fullColor === "Blue, with Terra and Gold Bubbles") {
    return 'B';
  }
  
  if (fullColor === "Smokefired Blue with Red and Bronze Bubbles") {
    return 'SB';
  }
  
  // Check for smokefired colors first (more specific)
  
  // SB: Smokefired Blue (various patterns)
  if (lowerColor.includes('smokefired blue')) {
    return 'SB';
  }
  
  // TB: Smokefired Terra with Bronze Bubbles (various patterns)
  if (lowerColor.includes('smokefired terra with') && lowerColor.includes('bronze bubbles')) {
    return 'TB';
  }
  
  // T: Smokefired Terra and Black (tiger stripe)
  if (lowerColor.includes('smokefired terra') && lowerColor.includes('black')) {
    return 'T';
  }
  
  // C: Smokefired Black with Copper Bubbles (various patterns)
  if (lowerColor.includes('smokefired black') && lowerColor.includes('copper bubbles')) {
    return 'C';
  }
  
  // Check for regular blue (not smokefired)
  if (lowerColor.includes('blue') && !lowerColor.includes('smokefired')) {
    return 'B';
  }
  
  return '';
}

/**
 * Fallback color code based on instrument type
 */
export function getColorCodeFromInstrumentType(instrumentType: string): string {
  const lowerType = instrumentType.toLowerCase();
  if (lowerType.includes('innato')) return 'B'; // Blue
  if (lowerType.includes('natey')) return 'SB'; // Smokefired Blue
  if (lowerType.includes('double')) return 'T'; // Terra (tiger stripe)
  if (lowerType.includes('zen')) return 'TB'; // Terra with Bronze Bubbles
  if (lowerType.includes('ova')) return 'C'; // Copper bubbles
  return '';
}

/**
 * Get the full color description for a given color code
 */
export function getColorDescription(colorCode: string): string {
  switch (colorCode) {
    case 'B': return 'Blue';
    case 'SB': return 'Smokefired Blue';
    case 'T': return 'Smokefired Terra and Black (tiger stripe)';
    case 'TB': return 'Smokefired Terra with Bronze Bubbles';
    case 'C': return 'Smokefired Black with Copper Bubbles';
    default: return '';
  }
}