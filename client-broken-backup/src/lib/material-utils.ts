import { apiRequest } from './queryClient';
import { Order, OrderItem } from '@shared/schema';
import { SERIAL_NUMBER_DATABASE } from '@shared/serial-number-database';

// Type definitions
export type MaterialSetting = {
  tuning: string;
  bagSize: string;
  boxSize: string;
};

export type MaterialSettings = {
  [key: string]: MaterialSetting[];
};

export type MaterialSettingsResponse = {
  materialSettings: MaterialSettings;
};

/**
 * Get material settings from the API
 */
export async function getMaterialSettings(): Promise<MaterialSettings> {
  try {
    const response = await apiRequest('GET', '/api/settings');
    const data = await response.json() as MaterialSettingsResponse;
    return data.materialSettings || {};
  } catch (error) {
    console.error('Failed to fetch material settings:', error);
    return {};
  }
}

/**
 * Clean a tuning note (e.g., extract C4 from Cm4)
 */
export function cleanTuningNote(note: string | undefined): string | undefined {
  if (!note) return undefined;
  
  console.log(`Cleaning tuning note: "${note}"`);
  
  // Handle "NATEY Dm4" format (extract the D4)
  if (note.includes('NATEY') || note.includes('Natey')) {
    const dmMatch = note.match(/([A-G][#b]?)m?(\d)/i);
    if (dmMatch) {
      const [_, notePart, octave] = dmMatch;
      const cleanedNote = `${notePart.toUpperCase()}${octave}`;
      console.log(`Extracted from NATEY format: "${cleanedNote}"`);
      return cleanedNote;
    }
  }
  
  // Handle INNATO Dm4 format (Extract the D4)
  if (note.includes('INNATO') || note.includes('Innato')) {
    const dmMatch = note.match(/([A-G][#b]?)m?(\d)/i);
    if (dmMatch) {
      const [_, notePart, octave] = dmMatch;
      const cleanedNote = `${notePart.toUpperCase()}${octave}`;
      console.log(`Extracted from INNATO format: "${cleanedNote}"`);
      return cleanedNote;
    }
  }
  
  // Handle special formats like "Cm4" (C minor 4th octave)
  // Extract just the note and octave (C4)
  const minorMatch = note.match(/([A-G][#b]?)m(\d)/i);
  if (minorMatch) {
    const [_, notePart, octave] = minorMatch;
    const cleanedNote = `${notePart.toUpperCase()}${octave}`;
    console.log(`Converted minor format "${note}" to "${cleanedNote}"`);
    return cleanedNote;
  }
  
  // Handle standard format like "F#3" (F sharp 3rd octave)
  const standardMatch = note.match(/([A-G][#b]?)(\d)/i);
  if (standardMatch) {
    const [_, notePart, octave] = standardMatch;
    const cleanedNote = `${notePart.toUpperCase()}${octave}`;
    console.log(`Extracted standard note format: "${cleanedNote}"`);
    return cleanedNote;
  }
  
  // Simple replacement for minor notation
  const cleanedNote = note.replace(/m(?=[1-6])/i, '');
  if (cleanedNote !== note) {
    console.log(`Simplified minor notation: "${note}" to "${cleanedNote}"`);
    return cleanedNote;
  }
  
  // For anything else, just return the original
  console.log(`No pattern matched, using original: "${note}"`);
  return note;
}

/**
 * Get the normalized instrument type for material settings lookup
 */
export function getNormalizedInstrumentType(instrumentType: string | undefined): string | null {
  if (!instrumentType) return null;
  
  const typeUpper = instrumentType.toUpperCase();
  
  if (typeUpper.includes('INNATO')) return 'innato';
  if (typeUpper.includes('NATEY')) return 'natey';
  if (typeUpper.includes('ZEN')) return 'zen';
  if (typeUpper.includes('DOUBLE')) return 'double';
  if (typeUpper.includes('OVA')) return 'ova';
  if (typeUpper.includes('CARDS')) return 'cards';
  
  return null;
}

/**
 * Extract base note from tuning
 */
export function getBaseNoteFromTuning(
  materialType: string,
  tuningNote: string | undefined
): string | undefined {
  if (!tuningNote) return undefined;
  
  console.log(`Processing tuning "${tuningNote}" for ${materialType}`);
  
  // Explicit debug to help track issues
  console.log(`TUNING DEBUG: Material Type = ${materialType}, Raw Tuning = ${tuningNote}`);
  
  // Handle specific material types differently
  if (materialType === 'innato') {
    // For INNATO, clean up minor indicator if present
    const baseNote = cleanTuningNote(tuningNote);
    console.log('INNATO - cleaned tuning note:', baseNote);
    
    // Direct mapping for known values
    const innatoTunings = ['E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3'];
    for (const validTuning of innatoTunings) {
      if (baseNote?.includes(validTuning) || tuningNote.includes(validTuning)) {
        console.log(`INNATO - matched exact tuning: ${validTuning}`);
        return validTuning;
      }
    }
    
    return baseNote;
  }
  else if (materialType === 'natey') {
    // Special case for NATEY with DM4 or Dm4 format
    if (tuningNote.includes('DM4') || tuningNote.includes('Dm4') || 
        (tuningNote.includes('D') && tuningNote.includes('4'))) {
      console.log('NATEY with D4 format - using D4');
      return 'D4';
    }
    
    // For NATEY with other M formats, extract the note letter and add octave 4
    if (tuningNote.includes('M')) {
      const noteMatch = tuningNote.match(/([A-G][#b]?)/i);
      if (noteMatch) {
        const baseNote = noteMatch[1] + '4';
        console.log('NATEY with M format - using:', baseNote);
        return baseNote;
      }
    }
    
    // Direct mapping for known values
    const nateyTunings = ['A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 
                         'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'];
    for (const validTuning of nateyTunings) {
      if (tuningNote.includes(validTuning)) {
        console.log(`NATEY - matched exact tuning: ${validTuning}`);
        return validTuning;
      }
    }
    
    // When all else fails, take the first letter and assume octave 4
    if (/[A-G]/i.test(tuningNote)) {
      const baseNote = tuningNote.match(/[A-G][#b]?/i)?.[0].toUpperCase() + '4';
      console.log('NATEY - extracted note with assumed octave 4:', baseNote);
      return baseNote;
    }
    
    // Just cleaned version
    return cleanTuningNote(tuningNote);
  }
  else if (materialType === 'zen') {
    console.log(`ZEN FLUTE DEBUG - Analyzing tuning note: "${tuningNote}"`);
    
    // First check specification for explicit "L" or "M" indicator (case-insensitive)
    if (tuningNote) {
      if (tuningNote.toLowerCase().includes(' l') || 
          tuningNote.toLowerCase() === 'l' || 
          tuningNote.toLowerCase().includes('large') || 
          tuningNote.toLowerCase().includes('size l')) {
        console.log('ZEN - explicitly identified as size L');
        return 'L';
      } 
      
      if (tuningNote.toLowerCase().includes(' m') || 
          tuningNote.toLowerCase() === 'm' || 
          tuningNote.toLowerCase().includes('medium') || 
          tuningNote.toLowerCase().includes('size m')) {
        console.log('ZEN - explicitly identified as size M');
        return 'M';
      }
    }
    
    // Look for explicit size indicators
    if (tuningNote && tuningNote.length <= 3) {
      if (tuningNote.toUpperCase().includes('L')) {
        console.log('ZEN - using size L (short format)');
        return 'L';
      } 
      if (tuningNote.toUpperCase().includes('M')) {
        console.log('ZEN - using size M (short format)');
        return 'M';
      }
    }
    
    // Default to M if we can't determine
    console.log('ZEN - unable to determine size, defaulting to M');
    return 'M';
  }
  else if (materialType === 'double') {
    // Direct mapping for known values
    const doubleTunings = ['C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'];
    for (const validTuning of doubleTunings) {
      if (tuningNote.includes(validTuning)) {
        console.log(`DOUBLE - matched exact tuning: ${validTuning}`);
        return validTuning;
      }
    }
    
    // Just cleaned version
    const baseNote = cleanTuningNote(tuningNote);
    console.log('DOUBLE - cleaned tuning note:', baseNote);
    return baseNote;
  }
  else if (materialType === 'ova') {
    // For OVA, we only have one tuning in the settings
    return '64 Hz';
  }
  else {
    // For all other cases, clean the note first
    const baseNote = cleanTuningNote(tuningNote);
    console.log('Standard format - using base note:', baseNote);
    return baseNote;
  }
}

/**
 * Find the appropriate material setting based on instrument type and tuning
 */
export function findMaterialSetting(
  settings: MaterialSettings,
  order: Order | OrderItem
): { bagSize: string, boxSize: string } | null {
  console.log('=== FINDING MATERIAL SETTING ===');
  console.log('Order/Item:', order);
  console.log('Settings structure:', Object.keys(settings));
  
  // Extract instrument type and tuning
  const instrumentType = getInstrumentTypeFromOrder(order);
  const tuningNote = getTuningFromOrder(order);
  
  console.log('Extracted instrumentType:', instrumentType);
  console.log('Extracted tuningNote:', tuningNote);
  
  // Normalize the instrument type to match the settings keys
  const materialType = getNormalizedInstrumentType(instrumentType);
  console.log('Normalized instrument type:', materialType);
  
  if (!materialType) {
    console.warn(`Unknown instrument type: ${instrumentType}`);
    return null;
  }
  
  // Special case for CARDS (no bag, envelope box)
  if (materialType === 'cards') {
    console.log('Special case: CARDS product - using Envelope box and no bag');
    return { bagSize: '-', boxSize: 'Envelope' };
  }
  
  // Get settings for this instrument type
  const typeSettings = settings[materialType];
  console.log(`Settings for ${materialType}:`, typeSettings);
  
  if (!typeSettings || !typeSettings.length) {
    console.warn(`No material settings found for instrument type: ${materialType}`);
    return null;
  }
  
  // For debugging, let's print all the tunings available for this material type
  console.log(`Available tunings for ${materialType}:`, typeSettings.map(s => s.tuning));
  
  // Extract the base note for matching with material settings
  const baseNote = getBaseNoteFromTuning(materialType, tuningNote);
  console.log('Base note extracted for matching:', baseNote);
  
  if (!baseNote) {
    console.warn(`No tuning note found for ${materialType} order`);
    
    // Use default if available
    const defaultSetting = typeSettings.find(setting => setting.tuning === 'default');
    if (defaultSetting) {
      console.log('Using default setting as no tuning found:', defaultSetting);
      return { bagSize: defaultSetting.bagSize, boxSize: defaultSetting.boxSize };
    }
    
    // Fall back to first setting if no default
    if (typeSettings.length > 0) {
      console.log('No default setting found, using first available:', typeSettings[0]);
      return { bagSize: typeSettings[0].bagSize, boxSize: typeSettings[0].boxSize };
    }
    
    return null;
  }
  
  // Find exact match for this tuning
  const exactMatch = typeSettings.find(setting => setting.tuning === baseNote);
  if (exactMatch) {
    console.log(`Found exact match for ${baseNote} in ${materialType} settings: ${JSON.stringify(exactMatch)}`);
    return { bagSize: exactMatch.bagSize, boxSize: exactMatch.boxSize };
  } else {
    console.log(`No exact match found for tuning ${baseNote} in ${materialType} settings`);
  }
  
  // Check for range-based matches (like E4-G3)
  console.log('Checking for range-based matches...');
  for (const setting of typeSettings) {
    if (setting.tuning.includes('-') && baseNote) {
      console.log(`Checking range: ${setting.tuning} for tuning: ${baseNote}`);
      
      const [startNote, endNote] = setting.tuning.split('-').map(t => t.trim());
      console.log(`Range bounds: ${startNote} to ${endNote}`);
      
      // Extract octave numbers for comparison
      const baseOctave = parseInt(baseNote.replace(/[^0-9]/g, '') || '0', 10);
      console.log(`Base note octave: ${baseOctave}`);
      
      const startOctave = parseInt(startNote.replace(/[^0-9]/g, '') || '0', 10);
      const endOctave = parseInt(endNote.replace(/[^0-9]/g, '') || '0', 10);
      console.log(`Range octaves: ${startOctave} to ${endOctave}`);
      
      // For INNATO, special range handling - check if the note is within the specified range
      if (materialType === 'innato') {
        // Notes are ordered from highest to lowest: E4, D#4, ..., F3, E3
        const innatoOrder = ['E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3'];
        
        const startIdx = innatoOrder.indexOf(startNote);
        const endIdx = innatoOrder.indexOf(endNote);
        const baseIdx = innatoOrder.indexOf(baseNote);
        
        if (startIdx !== -1 && endIdx !== -1 && baseIdx !== -1) {
          // Check if base note is within the range (inclusive)
          if (baseIdx >= startIdx && baseIdx <= endIdx) {
            console.log(`Found ${baseNote} in INNATO range ${startNote}-${endNote}`);
            return { bagSize: setting.bagSize, boxSize: setting.boxSize };
          }
        }
        // For octave-based comparison (fallback)
        else if (baseOctave >= startOctave && baseOctave <= endOctave) {
          console.log(`INNATO octave match - ${baseNote} in range ${startNote}-${endNote}`);
          return { bagSize: setting.bagSize, boxSize: setting.boxSize };
        }
      } 
      // For NATEY, special range handling
      else if (materialType === 'natey') {
        // Notes are ordered from highest to lowest: A4, G#4, ..., G#3, G3  
        const nateyOrder = ['A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'];
        
        const startIdx = nateyOrder.indexOf(startNote);
        const endIdx = nateyOrder.indexOf(endNote);
        const baseIdx = nateyOrder.indexOf(baseNote);
        
        if (startIdx !== -1 && endIdx !== -1 && baseIdx !== -1) {
          // Check if base note is within the range (inclusive)
          if (baseIdx >= startIdx && baseIdx <= endIdx) {
            console.log(`Found ${baseNote} in NATEY range ${startNote}-${endNote}`);
            return { bagSize: setting.bagSize, boxSize: setting.boxSize };
          }
        }
        // For octave-based comparison (fallback)
        else if (baseOctave >= startOctave && baseOctave <= endOctave) {
          console.log(`NATEY octave match - ${baseNote} in range ${startNote}-${endNote}`);
          return { bagSize: setting.bagSize, boxSize: setting.boxSize };
        }
      }
      // For DOUBLE, special range handling
      else if (materialType === 'double') {
        // Notes are ordered from highest to lowest: C#4, C4, ..., G#3, G3
        const doubleOrder = ['C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'];
        
        const startIdx = doubleOrder.indexOf(startNote);
        const endIdx = doubleOrder.indexOf(endNote);
        const baseIdx = doubleOrder.indexOf(baseNote);
        
        if (startIdx !== -1 && endIdx !== -1 && baseIdx !== -1) {
          // Check if base note is within the range (inclusive)
          if (baseIdx >= startIdx && baseIdx <= endIdx) {
            console.log(`Found ${baseNote} in DOUBLE range ${startNote}-${endNote}`);
            return { bagSize: setting.bagSize, boxSize: setting.boxSize };
          }
        }
        // For octave-based comparison (fallback)
        else if (baseOctave >= startOctave && baseOctave <= endOctave) {
          console.log(`DOUBLE octave match - ${baseNote} in range ${startNote}-${endNote}`);
          return { bagSize: setting.bagSize, boxSize: setting.boxSize };
        }
      }
      // Default case - simple octave range check
      else if (baseOctave >= startOctave && baseOctave <= endOctave) {
        console.log(`Found ${baseNote} in range ${startNote}-${endNote} for ${materialType}`);
        return { bagSize: setting.bagSize, boxSize: setting.boxSize };
      } else {
        console.log(`${baseNote} not in range ${startNote}-${endNote}`);
      }
    }
  }
  
  // If no match, use default if available
  const defaultSetting = typeSettings.find(setting => setting.tuning === 'default');
  if (defaultSetting) {
    console.log(`Using default setting for ${materialType}:`, defaultSetting);
    return { bagSize: defaultSetting.bagSize, boxSize: defaultSetting.boxSize };
  }
  
  // Last resort: use first setting
  if (typeSettings.length > 0) {
    console.log(`No matching setting found, using first available for ${materialType}:`, typeSettings[0]);
    return { bagSize: typeSettings[0].bagSize, boxSize: typeSettings[0].boxSize };
  }
  
  console.warn(`Could not find material settings for ${materialType} with tuning ${baseNote}`);
  console.log('=== END FINDING MATERIAL SETTING ===');
  return null;
}

/**
 * Extract instrument type from an order or order item
 */
export function getInstrumentTypeFromOrder(order: Order | OrderItem): string | undefined {
  console.log('Determining instrument type for order/item:', order);
  
  // BELANGRIJKE UPDATE: Check eerst expliciet de serienummer database - DE BRON VAN WAARHEID
  if ('serialNumber' in order && order.serialNumber) {
    // Import zou hier циркulair referentie kunnen veroorzaken, dus we definiëren de functie inline
    // Maar dezelfde logica wordt gebruikt als in de originele safeGetFromSerialNumberDatabase
    try {
      // Deze functie zoekt het instrument type direct op in de centrale database
      // Dit zou overal gelijke resultaten moeten geven
      console.log(`SERIENUMMER CHECK: Zoeken naar ${order.serialNumber} in database...`);
      
      // Gebruik importeerde database
      if (typeof SERIAL_NUMBER_DATABASE !== 'undefined' && SERIAL_NUMBER_DATABASE !== null) {
        if (Object.prototype.hasOwnProperty.call(SERIAL_NUMBER_DATABASE, order.serialNumber)) {
          const dbSpecs = SERIAL_NUMBER_DATABASE[order.serialNumber];
          console.log(`*** PRIORITEIT - Serienummer ${order.serialNumber} gevonden in database: ${dbSpecs.type}`);
          return dbSpecs.type;
        } else {
          console.log(`Serienummer ${order.serialNumber} niet gevonden in database, fallback naar normale logica`);
        }
      }
    } catch (err) {
      console.error(`Fout bij raadplegen van serienummer database voor ${order.serialNumber}:`, err);
    }
  }
  
  // First check if there's an itemType field
  if ('itemType' in order && order.itemType) {
    const itemType = order.itemType.toString();
    console.log('Using itemType field:', itemType);
    
    // Extract just the primary instrument type
    if (itemType.toUpperCase().includes('INNATO')) {
      // Special case: If it's an "INNATO Exploration" or contains "CARDS", it's a CARDS product
      if (itemType.toUpperCase().includes('EXPLORATION') || itemType.toUpperCase().includes('CARDS')) {
        console.log('Identified as CARDS product from itemType');
        return 'CARDS';
      }
      console.log('Identified as INNATO from itemType');
      return 'INNATO';
    }
    
    if (itemType.toUpperCase().includes('NATEY')) {
      console.log('Identified as NATEY from itemType');
      return 'NATEY';
    }
    
    if (itemType.toUpperCase().includes('ZEN')) {
      console.log('Identified as ZEN from itemType');
      return 'ZEN';
    }
    
    if (itemType.toUpperCase().includes('DOUBLE')) {
      console.log('Identified as DOUBLE from itemType');
      return 'DOUBLE';
    }
    
    if (itemType.toUpperCase().includes('OVA')) {
      console.log('Identified as OVA from itemType');
      return 'OVA';
    }
    
    if (itemType.toUpperCase().includes('CARDS')) {
      console.log('Identified as CARDS from itemType');
      return 'CARDS';
    }
    
    console.log('Using first word from itemType:', itemType.split(' ')[0]);
    return itemType.split(' ')[0]; // Just the first word
  }
  
  // Check specifications
  const specs = ('specifications' in order) ? order.specifications : undefined;
  if (specs && typeof specs === 'object') {
    const specsRecord = specs as Record<string, string>;
    console.log('Checking specifications for instrument type');
    
    // First check for explicit model field
    if (specsRecord?.['model']) {
      const modelValue = specsRecord['model'];
      console.log('Found model field in specifications:', modelValue);
      
      // Return the exact model as specified (preserving case)
      if (modelValue.toUpperCase().includes('INNATO')) {
        // Special case: If it's an "INNATO Exploration" or "CARDS" order, it's a CARDS product
        if (modelValue.toUpperCase().includes('EXPLORATION') || modelValue.toUpperCase().includes('CARDS')) {
          console.log('Identified as CARDS product from model');
          return 'CARDS';
        }
        return 'INNATO';
      }
      
      if (modelValue.toUpperCase().includes('NATEY')) return 'NATEY';
      if (modelValue.toUpperCase().includes('ZEN')) return 'ZEN';
      if (modelValue.toUpperCase().includes('DOUBLE')) return 'DOUBLE';
      if (modelValue.toUpperCase().includes('OVA')) return 'OVA';
      if (modelValue.toUpperCase().includes('CARDS')) return 'CARDS';
      
      // If we found a model but it doesn't match any of our known types, return it anyway
      return modelValue;
    }
    
    // Then check for explicit type field
    if (specsRecord?.['type']) {
      const typeValue = specsRecord['type'];
      console.log('Found type field in specifications:', typeValue);
      
      // Return the exact type as specified (preserving case)
      if (typeValue.toUpperCase().includes('INNATO')) {
        // Special case: If it's an "INNATO Exploration" or "CARDS" order, it's a CARDS product
        if (typeValue.toUpperCase().includes('EXPLORATION') || typeValue.toUpperCase().includes('CARDS')) {
          console.log('Identified as CARDS product from type');
          return 'CARDS';
        }
        return 'INNATO';
      }
      
      if (typeValue.toUpperCase().includes('NATEY')) return 'NATEY';
      if (typeValue.toUpperCase().includes('ZEN')) return 'ZEN';
      if (typeValue.toUpperCase().includes('DOUBLE')) return 'DOUBLE';
      if (typeValue.toUpperCase().includes('OVA')) return 'OVA';
      if (typeValue.toUpperCase().includes('CARDS')) return 'CARDS';
      
      // If we found a type but it doesn't match any of our known types, return it anyway
      return typeValue.split(' ')[0]; // Just take the first word
    }
    
    // Check name or title fields if available
    const nameValue = specsRecord?.['name'];
    if (nameValue) {
      console.log('Found name field in specifications:', nameValue);
      if (nameValue.toUpperCase().includes('INNATO')) {
        if (nameValue.toUpperCase().includes('EXPLORATION') || nameValue.toUpperCase().includes('CARDS')) {
          return 'CARDS';
        }
        return 'INNATO';
      }
      if (nameValue.toUpperCase().includes('NATEY')) return 'NATEY';
      if (nameValue.toUpperCase().includes('ZEN')) return 'ZEN';
      if (nameValue.toUpperCase().includes('DOUBLE')) return 'DOUBLE';
      if (nameValue.toUpperCase().includes('OVA')) return 'OVA';
      if (nameValue.toUpperCase().includes('CARDS')) return 'CARDS';
    }
    
    const titleValue = specsRecord?.['title'];
    if (titleValue) {
      console.log('Found title field in specifications:', titleValue);
      if (titleValue.toUpperCase().includes('INNATO')) {
        if (titleValue.toUpperCase().includes('EXPLORATION') || titleValue.toUpperCase().includes('CARDS')) {
          return 'CARDS';
        }
        return 'INNATO';
      }
      if (titleValue.toUpperCase().includes('NATEY')) return 'NATEY';
      if (titleValue.toUpperCase().includes('ZEN')) return 'ZEN';
      if (titleValue.toUpperCase().includes('DOUBLE')) return 'DOUBLE';
      if (titleValue.toUpperCase().includes('OVA')) return 'OVA';
      if (titleValue.toUpperCase().includes('CARDS')) return 'CARDS';
    }
    
    // Special case: CARDS identification by missing tuning and color
    // CARDS products often don't have tuning or color specifications
    const hasNoTuning = !specsRecord['tuning'] && !specsRecord['Tuning'] && 
                       !specsRecord['tuningType'] && !specsRecord['TuningType'] && 
                       !specsRecord['note'];
    
    const hasNoColor = !specsRecord['color'] && !specsRecord['Color'] && 
                      !specsRecord['finish'] && !specsRecord['Finish'];
    
    if (hasNoTuning && hasNoColor) {
      // Likely a CARDS product if it has no tuning and no color
      console.log('No tuning and no color found - likely a CARDS product');
      return 'CARDS';
    }
  }
  
  // If we couldn't determine the type, special check for common order numbers known to be CARDS
  if ('orderNumber' in order) {
    const knownCardsOrders = ['1583', '1535']; // Add more as needed
    const orderNum = order.orderNumber?.replace(/\D/g, ''); // Extract just the number
    
    if (orderNum && knownCardsOrders.includes(orderNum)) {
      console.log(`Order ${orderNum} is known to be a CARDS product`);
      return 'CARDS';
    }
  }
  
  console.log('Could not determine instrument type');
  return undefined;
}

/**
 * Extract tuning information from an order
 */
export function getTuningFromOrder(order: Order | OrderItem): string | undefined {
  // NIEUWE STRUCTUUR: Check eerst de serienummer database voor permanente tuning toewijzingen
  if ('serialNumber' in order && order.serialNumber) {
    try {
      // Directe controle in de centrale database (consistent met getInstrumentTypeFromOrder)
      console.log(`TUNING SERIENUMMER CHECK: Zoeken naar ${order.serialNumber} in database...`);
      
      // Gebruik importeerde database
      if (typeof SERIAL_NUMBER_DATABASE !== 'undefined' && SERIAL_NUMBER_DATABASE !== null) {
        if (Object.prototype.hasOwnProperty.call(SERIAL_NUMBER_DATABASE, order.serialNumber)) {
          const dbSpecs = SERIAL_NUMBER_DATABASE[order.serialNumber];
          console.log(`*** PRIORITEIT TUNING - Serienummer ${order.serialNumber} gevonden in database: ${dbSpecs.tuning}`);
          return dbSpecs.tuning;
        } else {
          console.log(`Serienummer ${order.serialNumber} niet gevonden in database voor tuning, fallback naar normale logica`);
        }
      }
    } catch (err) {
      console.error(`Fout bij raadplegen van serienummer database voor tuning ${order.serialNumber}:`, err);
    }
  }
  
  // Check specifications
  const specs = ('specifications' in order) ? order.specifications : undefined;
  if (specs && typeof specs === 'object') {
    const specsRecord = specs as Record<string, string>;
    
    // Look for tuning in various fields
    const directTuning = specsRecord['tuning'] || 
                        specsRecord['Tuning'] || 
                        specsRecord['tuningType'] || 
                        specsRecord['TuningType'] || 
                        specsRecord['note'];
    
    if (directTuning) {
      console.log('Found direct tuning in specifications:', directTuning);
      return directTuning;
    }
    
    // Extract tuning from type field (e.g., "Natey Dm4" -> "Dm4")
    if (specsRecord['type']) {
      const typeStr = specsRecord['type'];
      
      // Special case for "Natey Dm4" format
      if (typeStr.includes('Natey') && typeStr.includes('Dm4')) {
        console.log('Found Natey Dm4 format in type field, returning D4');
        return 'D4';
      }
      
      // Extract a tuning pattern like A4, C#4, etc.
      const tuningMatch = typeStr.match(/([A-G][#b]?m?[0-9])/);
      if (tuningMatch && tuningMatch[1]) {
        console.log('Extracted tuning from type field:', tuningMatch[1]);
        return tuningMatch[1];
      }
    }
  }
  
  // Check if there's a direct tuning field
  if ('tuning' in order && order.tuning) {
    console.log('Using tuning field:', order.tuning);
    return order.tuning.toString();
  }
  
  if ('tuningType' in order && order.tuningType) {
    console.log('Using tuningType field:', order.tuningType);
    return order.tuningType.toString();
  }
  
  // As a last resort, check if itemType contains tuning information
  if ('itemType' in order && order.itemType) {
    const itemType = order.itemType.toString();
    
    // Special case for "Natey Dm4" format in itemType
    if (itemType.includes('Natey') && itemType.includes('Dm4')) {
      console.log('Found Natey Dm4 format in itemType, returning D4');
      return 'D4';
    }
    
    // Extract a tuning pattern like A4, C#4, etc.
    const tuningMatch = itemType.match(/([A-G][#b]?m?[0-9])/);
    if (tuningMatch && tuningMatch[1]) {
      console.log('Extracted tuning from itemType:', tuningMatch[1]);
      return tuningMatch[1];
    }
  }
  
  return undefined;
}

/**
 * Get the bag size for an instrument from material settings
 */
export function getBagSizeFromMaterialSettings(
  settings: MaterialSettings,
  order: Order | OrderItem
): string {
  const materialSetting = findMaterialSetting(settings, order);
  return materialSetting?.bagSize || 
         getFallbackBagSize(getInstrumentTypeFromOrder(order), getTuningFromOrder(order));
}

/**
 * Get the box size for an instrument from material settings
 */
export function getBoxSizeFromMaterialSettings(
  settings: MaterialSettings,
  order: Order | OrderItem
): string {
  console.log('=== GETTING BOX SIZE FOR ORDER ===');
  
  // First approach: Try to get the exact material setting that provides both bag and box sizes
  const materialSetting = findMaterialSetting(settings, order);
  if (materialSetting?.boxSize) {
    console.log('Found direct box size match in material settings:', materialSetting.boxSize);
    return materialSetting.boxSize;
  }
  
  // Second approach: Use the tuning to find the exact match in the material settings list
  const instrumentType = getInstrumentTypeFromOrder(order);
  const tuningNote = getTuningFromOrder(order);
  const normalizedType = getNormalizedInstrumentType(instrumentType);
  
  console.log('Finding box size for:', normalizedType, 'with tuning:', tuningNote);
  
  // Exit early if we don't have the necessary information
  if (!normalizedType || !settings || !settings[normalizedType]) {
    console.log('No material settings available for', normalizedType);
    return getFallbackBoxSize(instrumentType, tuningNote);
  }
  
  // Get the base note for matching with material settings
  const baseNote = getBaseNoteFromTuning(normalizedType, tuningNote);
  console.log('Base note for material matching:', baseNote);
  
  // Look for an exact match by tuning in the material settings
  if (baseNote) {
    const instrumentSettings = settings[normalizedType];
    const exactMatch = instrumentSettings.find(setting => setting.tuning === baseNote);
    
    if (exactMatch?.boxSize) {
      console.log('Found exact tuning match in settings:', exactMatch);
      return exactMatch.boxSize;
    }
  }
  
  // Third approach: Use the same logic as bag size determination, since boxes and bags are paired
  // Get the bag size first using the existing (working) logic
  const bagSize = getBagSizeFromMaterialSettings(settings, order);
  console.log('Determined bag size:', bagSize, '- now finding matching box');
  
  // Find a material setting with this bag size for this instrument type
  if (normalizedType && settings[normalizedType]) {
    const instrumentSettings = settings[normalizedType];
    
    // Try to find a setting with the same bag size
    const bagSizeMatch = instrumentSettings.find(setting => setting.bagSize === bagSize);
    if (bagSizeMatch?.boxSize) {
      console.log('Found box size from matching bag size:', bagSizeMatch.boxSize);
      return bagSizeMatch.boxSize;
    }
  }
  
  // Fallback to the hardcoded rules if nothing else worked
  console.log('Using fallback box size rules');
  return getFallbackBoxSize(instrumentType, tuningNote);
}

/**
 * Helper to find range match for NATEY tunings
 */
function findRangeMatchForNatey(
  settings: Array<{tuning: string, bagSize: string, boxSize: string}>, 
  tuningNote: string | undefined
): {tuning: string, bagSize: string, boxSize: string} | undefined {
  if (!tuningNote) return undefined;
  
  // Natey note ordering from highest to lowest
  const nateyNotes = ['A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 
                     'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3'];
  
  // Find tuning's position in the ordering
  const tuningIndex = nateyNotes.indexOf(tuningNote);
  if (tuningIndex === -1) return undefined;
  
  // Check each range setting
  for (const setting of settings) {
    if (setting.tuning.includes('-')) {
      const [highNote, lowNote] = setting.tuning.split('-').map(n => n.trim());
      const highIndex = nateyNotes.indexOf(highNote);
      const lowIndex = nateyNotes.indexOf(lowNote);
      
      if (highIndex !== -1 && lowIndex !== -1) {
        // Check if tuning is within range (inclusive)
        if (tuningIndex >= highIndex && tuningIndex <= lowIndex) {
          return setting;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Helper to find range match for INNATO tunings
 */
function findRangeMatchForInnato(
  settings: Array<{tuning: string, bagSize: string, boxSize: string}>, 
  tuningNote: string | undefined
): {tuning: string, bagSize: string, boxSize: string} | undefined {
  if (!tuningNote) return undefined;
  
  // Innato note ordering from highest to lowest
  const innatoNotes = ['E4', 'D#4', 'D4', 'C#4', 'C4', 'B3', 'Bb3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3'];
  
  // Find tuning's position in the ordering
  const tuningIndex = innatoNotes.indexOf(tuningNote);
  if (tuningIndex === -1) return undefined;
  
  // Check each range setting
  for (const setting of settings) {
    if (setting.tuning.includes('-')) {
      const [highNote, lowNote] = setting.tuning.split('-').map(n => n.trim());
      const highIndex = innatoNotes.indexOf(highNote);
      const lowIndex = innatoNotes.indexOf(lowNote);
      
      if (highIndex !== -1 && lowIndex !== -1) {
        // Check if tuning is within range (inclusive)
        if (tuningIndex >= highIndex && tuningIndex <= lowIndex) {
          return setting;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Fallback function to get bag size when API settings aren't available
 */
export function getFallbackBagSize(
  instrumentType: string | undefined,
  tuningNote: string | undefined
): string {
  if (!instrumentType) return 'M'; // Default
  
  const typeUpper = instrumentType.toUpperCase();
  let cleanedTuning = tuningNote;
  
  // Clean tuning note if it has format like "Cm4" -> "C4"
  if (cleanedTuning && cleanedTuning.match(/[A-G][#b]?m[0-9]/)) {
    cleanedTuning = cleanedTuning.replace(/m(?=[0-9])/i, '');
  }
  
  // INNATO bag sizes
  if (typeUpper.includes('INNATO')) {
    // E4, D#4, D4 -> Size S
    if (cleanedTuning?.includes('E4') || 
        cleanedTuning?.includes('D#4') || 
        cleanedTuning?.includes('D4')) {
      return 'S';
    }
    // C#4, C4 -> Size M
    else if (cleanedTuning?.includes('C#4') || 
             cleanedTuning?.includes('C4')) {
      return 'M';
    }
    // B3, Bb3 -> Size L
    else if (cleanedTuning?.includes('B3') || 
             cleanedTuning?.includes('Bb3')) {
      return 'L';
    }
    // A3, G#3 -> Size XL
    else if (cleanedTuning?.includes('A3') || 
             cleanedTuning?.includes('G#3')) {
      return 'XL';
    }
    // G3, F#3, F3, E3 -> Size XXL
    else if (cleanedTuning?.includes('G3') || 
             cleanedTuning?.includes('F#3') || 
             cleanedTuning?.includes('F3') || 
             cleanedTuning?.includes('E3')) {
      return 'XXL';
    }
    return 'M'; // Default
  } 
  // NATEY bag sizes
  else if (typeUpper.includes('NATEY')) {
    // A4, G#4, G4, F#4, F4 -> Size S
    if (cleanedTuning?.includes('A4') || 
        cleanedTuning?.includes('G#4') || 
        cleanedTuning?.includes('G4') || 
        cleanedTuning?.includes('F#4') || 
        cleanedTuning?.includes('F4')) {
      return 'S';
    }
    // E4, D#4, D4, C#4, C4, B3 -> Size M
    else if (cleanedTuning?.includes('E4') || 
             cleanedTuning?.includes('D#4') || 
             cleanedTuning?.includes('D4') || 
             cleanedTuning?.includes('C#4') || 
             cleanedTuning?.includes('C4') || 
             cleanedTuning?.includes('B3')) {
      return 'M';
    }
    // Bb3, A3, G#3, G3 -> Size L
    else if (cleanedTuning?.includes('Bb3') || 
             cleanedTuning?.includes('A3') || 
             cleanedTuning?.includes('G#3') || 
             cleanedTuning?.includes('G3')) {
      return 'L';
    }
    return 'M'; // Default
  } 
  // ZEN flute bags
  else if (typeUpper.includes('ZEN')) {
    if (cleanedTuning?.includes('L')) {
      return 'L';
    } else if (cleanedTuning?.includes('M')) {
      return 'M';
    }
    return 'M'; // Default
  } 
  // DOUBLE flute bags
  else if (typeUpper.includes('DOUBLE')) {
    // C#4, C4, B3 -> Size M
    if (cleanedTuning?.includes('C#4') || 
        cleanedTuning?.includes('C4') || 
        cleanedTuning?.includes('B3')) {
      return 'M';
    }
    // Bb3, A3, G#3, G3 -> Size L
    else if (cleanedTuning?.includes('Bb3') || 
             cleanedTuning?.includes('A3') || 
             cleanedTuning?.includes('G#3') || 
             cleanedTuning?.includes('G3')) {
      return 'L';
    }
    return 'M'; // Default
  } 
  // OVA bags
  else if (typeUpper.includes('OVA')) {
    return 'OvAbag';
  } 
  // CARDS (no bag)
  else if (typeUpper.includes('CARDS')) {
    return '-';
  }
  
  return 'M'; // Default for unknown instruments
}

/**
 * Fallback function to get box size when API settings aren't available
 */
export function getFallbackBoxSize(
  instrumentType: string | undefined,
  tuningNote: string | undefined
): string {
  if (!instrumentType) return '30x30x30'; // Default
  
  const typeUpper = instrumentType.toUpperCase();
  let cleanedTuning = tuningNote;
  
  // Clean tuning note if it has format like "Cm4" -> "C4"
  if (cleanedTuning && cleanedTuning.match(/[A-G][#b]?m[0-9]/)) {
    cleanedTuning = cleanedTuning.replace(/m(?=[0-9])/i, '');
  }
  
  console.log(`Determining box size for ${typeUpper} with tuning ${cleanedTuning}`);
  
  // INNATO box sizes
  if (typeUpper.includes('INNATO')) {
    // Lower notes (G3, F#3, F3, E3) should get the larger box
    if (cleanedTuning?.includes('G3') || 
        cleanedTuning?.includes('F#3') || 
        cleanedTuning?.includes('F3') || 
        cleanedTuning?.includes('E3')) {
      console.log(`INNATO ${cleanedTuning} → Box 35x35x35`);
      return '35x35x35';
    } else {
      console.log(`INNATO ${cleanedTuning} → Box 30x30x30`);
      return '30x30x30';
    }
  } 
  // NATEY box sizes
  else if (typeUpper.includes('NATEY')) {
    // A4, G#4, G4, F#4, F4 => 15x15x15
    if (cleanedTuning?.includes('A4') || 
        cleanedTuning?.includes('G#4') || 
        cleanedTuning?.includes('G4') || 
        cleanedTuning?.includes('F#4') || 
        cleanedTuning?.includes('F4')) {
      console.log(`NATEY ${cleanedTuning} → Box 15x15x15`);
      return '15x15x15';
    } 
    // All other NATEY tunings => 12x12x30
    else {
      console.log(`NATEY ${cleanedTuning} → Box 12x12x30`);
      return '12x12x30';
    }
  } 
  // ZEN flute boxes
  else if (typeUpper.includes('ZEN')) {
    console.log(`ZEN ${cleanedTuning} → Box 15x15x15`);
    return '15x15x15';
  } 
  // DOUBLE flute boxes
  else if (typeUpper.includes('DOUBLE')) {
    console.log(`DOUBLE ${cleanedTuning} → Box 20x20x20`);
    return '20x20x20';
  } 
  // OVA boxes
  else if (typeUpper.includes('OVA')) {
    console.log(`OVA ${cleanedTuning} → Box 40x40x60`);
    return '40x40x60';
  } 
  // CARDS boxes
  else if (typeUpper.includes('CARDS')) {
    console.log(`CARDS → Box Envelope`);
    return 'Envelope';
  }
  
  console.log(`Unknown instrument type ${typeUpper}, using default box 30x30x30`);
  return '30x30x30'; // Default for unknown instruments
}