import type { Order, OrderItem } from '@shared/schema';
import { SERIAL_NUMBER_DATABASE } from '@shared/serial-number-database';

/**
 * Hulpmiddel voor gestructureerde bepaling van het instrument type
 * Normaliseert type-informatie en retourneert INNATO, NATEY, ZEN, etc.
 */
export function detectInstrumentType(item: Order | OrderItem): string | null {
  try {
    // Haal het instrument type op uit de specificaties
    let type: string | undefined;
    
    // Controleer eerst op serialNumber (meest betrouwbaar) - maar alleen voor OrderItem
    if ('serialNumber' in item && item.serialNumber) {
      const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
      if (dbSpecs && dbSpecs.type) {
        type = dbSpecs.type;
      }
    }
    
    // Als we geen type hebben uit serienummer, controleer specs
    if (!type && item.specifications) {
      const specs = item.specifications;
      if (typeof specs === 'object' && specs !== null) {
        // Bekend uit eerdere implementatie
        type = (specs as any).type || 
               (specs as any).TYPE || 
               (specs as any).instrumentType ||
               (specs as any).instrument_type ||
               (specs as any).flute_type;
      }
    }
    
    // Maak de type consistent voor vergelijkingen
    if (!type) return null;
    
    const upperType = type.toUpperCase();
    
    // Normaliseer naar hoofdcategorieën
    if (upperType.includes('INNATO')) return 'INNATO';
    if (upperType.includes('NATEY')) return 'NATEY';
    if (upperType.includes('DOUBLE')) return 'DOUBLE';
    if (upperType.includes('ZEN')) return 'ZEN';
    if (upperType.includes('OVA')) return 'OVA';
    if (upperType.includes('CARDS')) return 'CARDS';
    
    // Onbekend type (maar wel gedefinieerd)
    return upperType;
  } catch (error) {
    console.error('Error detecting instrument type:', error);
    return null;
  }
}

/**
 * Hulpmiddel om de tuning van een instrument op te halen uit verschillende bronnen
 * Controleert eerst serienummer database, dan specificaties
 */
export function getInstrumentTuning(item: Order | OrderItem): string | null {
  try {
    // Controleer eerst op serialNumber (meest betrouwbaar) - maar alleen voor OrderItem
    if ('serialNumber' in item && item.serialNumber) {
      const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
      if (dbSpecs && dbSpecs.tuning) {
        return dbSpecs.tuning;
      }
    }
    
    // Als we geen tuning hebben uit serienummer, controleer specs
    if (item.specifications) {
      // Haal tuning op uit specifications
      const specs = item.specifications;
      if (typeof specs === 'object' && specs !== null) {
        // Bekend uit eerdere implementatie
        const tuning = (specs as any).tuning || 
                     (specs as any).note || 
                     (specs as any).flute_note;
                     
        if (tuning) {
          return tuning;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting instrument tuning:', error);
    return null;
  }
}

/**
 * Controleer of twee tunings vergelijkbaar zijn, rekening houdend met instrumentspecifieke regels
 * 
 * @param tuning1 De eerste tuning om te vergelijken (uit item)
 * @param tuning2 De tweede tuning om te vergelijken (uit filter)
 * @param instrumentType Het type instrument (INNATO, NATEY, ZEN, etc.)
 * @returns true als de tunings vergelijkbaar zijn, anders false
 */
export function isTuningSimilar(tuning1: string, tuning2: string, instrumentType: string | null): boolean {
  try {
    console.log(`🔍 IS_TUNING_SIMILAR START - Compare ${tuning1} vs ${tuning2} for ${instrumentType || 'unknown'} instrument`);
    
    // Simpele check: zijn ze identiek?
    if (tuning1 === tuning2) {
      console.log(`🔍 EXACT MATCH FOUND: ${tuning1} === ${tuning2}`);
      return true;
    }
    
    // Normaliseren voor consistente vergelijking
    const normalizedTuning1 = normalizeTuning(tuning1);
    const normalizedTuning2 = normalizeTuning(tuning2);
    
    console.log(`🔍 NORMALIZED: ${normalizedTuning1} vs ${normalizedTuning2}`);
    
    // Als genormaliseerde waarden gelijk zijn, hebben we een match
    if (normalizedTuning1 === normalizedTuning2) {
      console.log(`🔍 NORMALIZED MATCH FOUND: ${normalizedTuning1} === ${normalizedTuning2}`);
      return true;
    }
    
    // Geen instrument type? Dan alleen exacte overeenkomsten
    if (!instrumentType) {
      console.log(`🔍 NO INSTRUMENT TYPE, ONLY EXACT MATCHES`);
      return false;
    }
    
    console.log(`🔍 USING INSTRUMENT-SPECIFIC COMPARISON FOR ${instrumentType}`);
    
    // Specifieke logica per instrument type
    let result = false;
    switch (instrumentType) {
      case 'ZEN':
        result = compareZenTunings(normalizedTuning1, normalizedTuning2);
        break;
      
      case 'INNATO':
        result = compareInnatoTunings(normalizedTuning1, normalizedTuning2);
        break;
      
      case 'NATEY':
        result = compareNateyTunings(normalizedTuning1, normalizedTuning2);
        break;
        
      case 'DOUBLE':
        result = compareDoubleTunings(normalizedTuning1, normalizedTuning2);
        break;
        
      default:
        // Voor andere instrumenten alleen exacte matches
        result = normalizedTuning1 === normalizedTuning2;
        break;
    }
    
    console.log(`🔍 FINAL RESULT: ${result ? 'MATCH' : 'NO MATCH'}`);
    return result;
  } catch (error) {
    console.error('Error comparing tunings:', error);
    return false;
  }
}

/**
 * Normaliseer een tuning string voor consistente vergelijking
 */
function normalizeTuning(tuning: string): string {
  if (!tuning) return '';
  
  // Naar hoofdletters voor consistentie
  let normalized = tuning.toUpperCase();
  
  // Vervang "MINOR" met "m" - bijv. "A MINOR" -> "Am"
  normalized = normalized.replace(/\s+MINOR/i, 'm');
  
  // Normaliseer "AM3" / "A3m" formaat naar consistent "Am3" formaat
  normalized = normalized.replace(/^([A-G])(\d+)[mM]$/i, '$1m$2');
  
  // Verwerk "MINOR A" -> "Am" formaat
  normalized = normalized.replace(/^MINOR\s+([A-G])/i, '$1m');
  
  // Verwerk "A440" of "A 440" -> "A"
  normalized = normalized.replace(/^([A-G])[\s-]?4[24]0.*$/i, '$1');
  
  // Trim whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Vergelijk ZEN fluit tunings (L/M/H)
 */
function compareZenTunings(tuning1: string, tuning2: string): boolean {
  // Eerst debuggen wat we vergelijken
  console.log(`ZEN TUNING COMPARE: ${tuning1} vs ${tuning2}`);

  // Normaliseer tunings naar enkele letter (L, M, H)
  const normalizeZenTuning = (tuning: string): string => {
    tuning = tuning.toUpperCase().trim();
    if (tuning === 'L' || tuning === 'LARGE') return 'L';
    if (tuning === 'M' || tuning === 'MEDIUM') return 'M';
    if (tuning === 'H' || tuning === 'HIGH') return 'H';
    // Als de tuning begint met L, M of H maar andere info bevat
    if (tuning.startsWith('L')) return 'L';
    if (tuning.startsWith('M')) return 'M';
    if (tuning.startsWith('H')) return 'H';
    // Anders, onbekend
    return tuning;
  };
  
  const normTuning1 = normalizeZenTuning(tuning1);
  const normTuning2 = normalizeZenTuning(tuning2);
  
  console.log(`ZEN TUNING NORMALIZED: ${normTuning1} vs ${normTuning2}`);
  
  // Vergelijk genormaliseerde tunings
  return normTuning1 === normTuning2;
}

/**
 * Vergelijk INNATO fluit tunings (majeur)
 */
function compareInnatoTunings(tuning1: string, tuning2: string): boolean {
  // Voor INNATO, we need to do an EXACT match including both note and octave
  if (tuning1.length > 0 && tuning2.length > 0) {
    console.log(`🔍 INNATO TUNING COMPARE (EXACT MATCH): ${tuning1} vs ${tuning2}`);
    
    // Prepare the tunings for comparison by normalizing them
    const normalizeTuning = (tuning: string): string => {
      // Handle potential 'm' suffix that might be present
      return tuning.replace(/([A-G][#b]?)m([0-9])/, '$1$2').toUpperCase().trim();
    };
    
    const normalizedTuning1 = normalizeTuning(tuning1);
    const normalizedTuning2 = normalizeTuning(tuning2);
    
    console.log(`🔍 INNATO TUNING NORMALIZED: ${normalizedTuning1} vs ${normalizedTuning2}`);
    
    // Use exact matching to ensure A3 only matches A3, B3 only matches B3, etc.
    const isMatch = normalizedTuning1 === normalizedTuning2;
    console.log(`🔍 INNATO TUNING MATCH RESULT: ${isMatch ? 'YES' : 'NO'}`);
    
    return isMatch;
  }
  
  return tuning1 === tuning2;
}

/**
 * Vergelijk NATEY fluit tunings (mineur)
 */
function compareNateyTunings(tuning1: string, tuning2: string): boolean {
  // Voor NATEY, exact match including note, minor indicator, and octave
  if (tuning1.length > 0 && tuning2.length > 0) {
    console.log(`NATEY TUNING COMPARE (EXACT MATCH): ${tuning1} vs ${tuning2}`);
    
    // Normalize for consistent comparison
    const normalizeTuning = (tuning: string): string => {
      // Ensure 'm' is present after note and before number, standardize formatting
      let normalized = tuning.toUpperCase().trim();
      
      // Handle different minor formats like "Am4", "A4m", "Am", "A MINOR"
      normalized = normalized.replace(/([A-G][#b]?)\s*MINOR\s*(\d*)/i, '$1m$2');
      normalized = normalized.replace(/([A-G][#b]?)(\d+)[mM]/i, '$1m$2');
      normalized = normalized.replace(/MINOR\s+([A-G][#b]?)(\d*)/i, '$1m$2');
      
      // Ensure consistent format
      if (normalized.includes('m') && !normalized.match(/m\d/)) {
        // If it has 'm' but no number after it, keep as is
        return normalized;
      }
      
      return normalized;
    };
    
    const normalizedTuning1 = normalizeTuning(tuning1);
    const normalizedTuning2 = normalizeTuning(tuning2);
    
    console.log(`NATEY TUNING NORMALIZED: ${normalizedTuning1} vs ${normalizedTuning2}`);
    
    // Exact matching ensures G#m4 only matches G#m4, Am3 only matches Am3, etc.
    return normalizedTuning1 === normalizedTuning2;
  }
  
  return tuning1 === tuning2;
}

/**
 * Vergelijk DOUBLE fluit tunings
 */
function compareDoubleTunings(tuning1: string, tuning2: string): boolean {
  // DOUBLE fluiten gebruiken dezelfde logica als INNATO (voor nu)
  return compareInnatoTunings(tuning1, tuning2);
}

/**
 * Functie om de serienummer database veilig te raadplegen
 */
function safeGetFromSerialNumberDatabase(serialNumber: string | null | undefined) {
  try {
    if (!serialNumber) return null;
    if (!SERIAL_NUMBER_DATABASE || typeof SERIAL_NUMBER_DATABASE !== 'object') return null;
    
    // Normalize serialNumber by removing any "SW-" prefix
    const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
    console.log(`SERIAL_NUMBER_DB (client): Normalized ${serialNumber} to ${normalizedSerialNumber}`);
    
    return SERIAL_NUMBER_DATABASE[normalizedSerialNumber] || null;
  } catch (err) {
    console.error('Error accessing serial number database:', err);
    return null;
  }
}