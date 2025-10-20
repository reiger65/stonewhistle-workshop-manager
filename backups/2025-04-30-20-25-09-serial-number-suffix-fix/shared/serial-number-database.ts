/**
 * SERIENUMMER CENTRALE DATABASE - VASTE TOEWIJZINGEN
 * ===================================================================
 *
 * Dit is de centrale "bron van waarheid" voor serienummers en vastgelegde specificaties.
 * Elk serienummer dat hier is gedefinieerd, zal ALTIJD deze exacte waardes tonen
 * ongeacht wat er in Shopify of elders is gedefinieerd.
 *
 * Als een serienummer op een fluit is gestempeld, voeg je het hier toe zodat
 * het altijd aan dezelfde specificaties gekoppeld blijft.
 *
 * Wanneer een fluit de BUILD fase bereikt, worden de specificaties automatisch
 * opgeslagen in deze database om toekomstige consistentie te garanderen.
 */

export interface SerialNumberSpec {
  type: string;
  tuning: string;
  frequency?: string;
  color?: string;
  notes?: string;
}

export const SERIAL_NUMBER_DATABASE: Record<string, SerialNumberSpec> = {
  // Order 1542 serienummers met permanente toewijzingen
  // Dit is een test/demo order met veel verschillende fluittypen
  '1542-1': {type: 'INNATO', tuning: 'Dm4', frequency: '432', color: 'SB'},
  '1542-2': {type: 'INNATO', tuning: 'Dm4', frequency: '440', color: 'TB'},
  '1542-3': {type: 'INNATO', tuning: 'Em4', frequency: '432', color: 'SB'},
  '1542-4': {type: 'INNATO', tuning: 'C4', frequency: '432', color: 'SB'},
  '1542-5': {type: 'NATEY', tuning: 'Dm4', frequency: '432', color: 'T'},
  '1542-6': {type: 'INNATO', tuning: 'Cm4', frequency: '432', color: 'SB'},
  '1542-7': {type: 'INNATO', tuning: 'Bm3', frequency: '432', color: 'SB'},
  '1542-8': {type: 'INNATO', tuning: 'Bm3', frequency: '432', color: 'SB'},
  '1542-9': {type: 'INNATO', tuning: 'Am3', frequency: '432', color: 'SB'},
  '1542-10': {type: 'NATEY', tuning: 'A3', frequency: '432', color: 'T'},
  '1542-11': {type: 'INNATO', tuning: 'Gm3', frequency: '432', color: 'SB'},
  '1542-12': {type: 'INNATO', tuning: 'Gm3', frequency: '432', color: 'SB'},
  '1542-13': {type: 'INNATO', tuning: 'G#m3', frequency: '432', color: 'SB'},
  '1542-14': {type: 'NATEY', tuning: 'Am3', frequency: '432', color: 'T'},
  '1542-15': {type: 'NATEY', tuning: 'Am3', frequency: '432', color: 'T'},
  
  // Enkele nummers weglaten om database niet te groot te maken
  '1542-48': {type: 'INNATO', tuning: 'Em4', frequency: '432', color: 'SB'},
  '1542-49': {type: 'INNATO', tuning: 'G3', frequency: '432', color: 'SB'},
  '1542-53': {type: 'INNATO', tuning: 'Em4', frequency: '432', color: 'SB'},
  '1542-54': {type: 'INNATO', tuning: 'Cm4', frequency: '432', color: 'SB'},
  '1542-57': {type: 'NATEY', tuning: 'F3', frequency: '432', color: 'B'},
  '1542-59': {type: 'INNATO', tuning: 'D4', frequency: '432', color: 'SB'},
  '1542-60': {type: 'INNATO', tuning: 'Gm3', frequency: '432', color: 'SB'},
  '1542-61': {type: 'NATEY', tuning: 'C4', frequency: '432', color: 'T'},
  '1542-63': {type: 'INNATO', tuning: 'Gm3', frequency: '432', color: 'SB'},
  '1542-65': {type: 'INNATO', tuning: 'Em4', frequency: '432', color: 'SB'},
  
  // Voeg hier meer serienummers toe met hun definitieve specificaties
  // Belangrijk: gebruik ALTIJD de juiste informatie hier, want deze overschrijft alles!
};

/**
 * Controleert of een serienummer in de centrale database bestaat
 * @param serialNumber Het te controleren serienummer
 * @returns True als het serienummer in de database bestaat
 */
export function checkSerialNumberInDatabase(serialNumber: string): boolean {
  // Verwijder de "SW-" prefix als die bestaat
  const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
  
  const result = normalizedSerialNumber in SERIAL_NUMBER_DATABASE;
  if (result) {
    console.log(`✅ SERIENUMMER CHECK: ${serialNumber} gevonden in database (${Object.keys(SERIAL_NUMBER_DATABASE).length} totaal)`);
  }
  return result;
}

/**
 * Haalt de specificaties op voor een serienummer uit de centrale database
 * @param serialNumber Het serienummer waarvoor specificaties worden opgevraagd
 * @returns De specificaties of undefined als het serienummer niet in de database staat
 */
export function getSpecificationsFromDatabase(serialNumber: string): SerialNumberSpec | undefined {
  // Verwijder de "SW-" prefix als die bestaat
  const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
  
  const specs = SERIAL_NUMBER_DATABASE[normalizedSerialNumber];
  if (specs) {
    console.log(`📋 SERIENUMMER SPECS: ${serialNumber} = ${specs.type} ${specs.tuning} (${specs.frequency || 'onbekend'}Hz)`);
  }
  return specs;
}

/**
 * Voegt een nieuw serienummer toe aan de database in runtime
 * Let op: Dit werkt alleen op de server en update het bestand niet permanent!
 * De SERVER_SERIAL_NUMBER_ADDITIONS worden in het geheugen opgeslagen tijdens de runtime
 * van de server en worden gebruikt als aanvulling op de vaste SERIAL_NUMBER_DATABASE
 */
export const SERVER_SERIAL_NUMBER_ADDITIONS: Record<string, SerialNumberSpec> = {};

// Map om Shopify line item IDs te koppelen aan serienummers
// Dit garandeert dat een specifiek Shopify item altijd hetzelfde serienummer heeft
export const SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER: Record<string, string> = {};

/**
 * Registreert een permanente koppeling tussen een Shopify line item ID en een serienummer
 * Deze koppeling wordt gebruikt om te garanderen dat een specifiek Shopify item altijd aan
 * hetzelfde serienummer wordt gekoppeld, ook als de order verandert.
 * 
 * @param shopifyLineItemId De Shopify line item ID
 * @param serialNumber Het serienummer
 */
export function registerShopifyLineItemMapping(shopifyLineItemId: string, serialNumber: string): void {
  if (!shopifyLineItemId || !serialNumber) {
    console.error('Kan geen koppeling maken zonder Shopify line item ID of serienummer');
    return;
  }
  
  // Controleer of deze mapping al bestaat
  if (SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId]) {
    const existingSerialNumber = SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId];
    
    // Als de mapping al bestaat en hetzelfde is, log dit en return
    if (existingSerialNumber === serialNumber) {
      console.log(`Shopify item ${shopifyLineItemId} is al gekoppeld aan serienummer ${serialNumber}`);
      return;
    }
    
    // Als er een conflict is, log een waarschuwing maar update de mapping niet
    // Dit zorgt ervoor dat een serienummer niet opnieuw kan worden toegewezen
    console.warn(`⚠️ CONFLICT: Shopify item ${shopifyLineItemId} is al gekoppeld aan serienummer ${existingSerialNumber}, maar er wordt geprobeerd om het te koppelen aan ${serialNumber}`);
    return;
  }
  
  // Registreer de nieuwe mapping
  SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId] = serialNumber;
  console.log(`✅ Shopify item ${shopifyLineItemId} permanent gekoppeld aan serienummer ${serialNumber}`);
}

/**
 * Haalt het serienummer op dat hoort bij een bepaalde Shopify line item ID
 * 
 * @param shopifyLineItemId De Shopify line item ID
 * @returns Het gekoppelde serienummer of undefined als er geen koppeling is
 */
export function getSerialNumberByShopifyLineItem(shopifyLineItemId: string): string | undefined {
  return SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId];
}

/**
 * Voegt een serienummer toe aan de runtime database
 * Dit wordt gebruikt wanneer een fluit de BUILD fase bereikt om toekomstige consistentie te garanderen
 * 
 * @param serialNumber Het serienummer dat moet worden toegevoegd
 * @param specs De specificaties die met dit serienummer moeten worden opgeslagen
 * @param shopifyLineItemId Optioneel: de Shopify line item ID om permanent te koppelen
 * @returns True als het serienummer is toegevoegd, false als het al bestond
 */
export function addSerialNumberToDatabase(
  serialNumber: string, 
  specs: any, 
  shopifyLineItemId?: string
): boolean {
  // Verwijder de "SW-" prefix als die bestaat
  const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
  
  // Als het serienummer al in de vaste database staat, niet overschrijven
  if (normalizedSerialNumber in SERIAL_NUMBER_DATABASE) {
    console.log(`⚠️ Serienummer ${serialNumber} staat al in de vaste database, niet opnieuw toevoegen`);
    return false;
  }
  
  // Als het serienummer al in de runtime database staat, niet overschrijven
  if (normalizedSerialNumber in SERVER_SERIAL_NUMBER_ADDITIONS) {
    console.log(`⚠️ Serienummer ${serialNumber} staat al in de runtime database, niet opnieuw toevoegen`);
    return false;
  }
  
  // Bepaal het type, tuning, frequency en color uit de specificaties
  let type = specs.fluteType || specs.model || specs.type || 'UNKNOWN';
  let tuning = specs.tuning || 'UNKNOWN';
  let frequency = specs.frequency || specs.tuningFrequency || '432';
  let color = specs.color || '';
  
  // Standaardiseer type (altijd hoofdletters)
  if (typeof type === 'string') {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('innato')) {
      type = 'INNATO';
    } else if (typeLower.includes('natey')) {
      type = 'NATEY';
    } else if (typeLower.includes('double')) {
      type = 'DOUBLE';
    } else if (typeLower.includes('zen')) {
      type = 'ZEN';
    } else if (typeLower.includes('cards')) {
      type = 'CARDS';
    }
  }
  
  // Standaardiseer tuning op basis van type
  // In de database slaan we alles op ZONDER 'm'-suffix, zodat de frontend kan beslissen of het nodig is of niet
  if (typeof tuning === 'string' && tuning.includes('m')) {
    // Als de tuning een 'm' bevat, verwijder deze voor database opslag
    const match = tuning.match(/([A-G])(#|b)?m([1-6])/);
    if (match) {
      const [_, noteLetter, accidental, octave] = match;
      tuning = `${noteLetter}${accidental || ''}${octave}`;
      console.log(`SERIENUMMER DB: 'm' suffix verwijderd van ${specs.tuning} -> ${tuning} voor opslag`);
    }
  }
  
  // Standaardiseer frequency (alleen het getal)
  if (typeof frequency === 'string') {
    if (frequency.includes('432')) {
      frequency = '432';
    } else if (frequency.includes('440')) {
      frequency = '440';
    }
  }
  
  // Voeg toe aan runtime database met genormaliseerd serienummer (zonder SW-)
  SERVER_SERIAL_NUMBER_ADDITIONS[normalizedSerialNumber] = {
    type,
    tuning,
    frequency,
    color,
    notes: `Automatisch toegevoegd aan database op ${new Date().toISOString()}`
  };
  
  // Als een Shopify line item ID is opgegeven, registreer de koppeling
  if (shopifyLineItemId) {
    registerShopifyLineItemMapping(shopifyLineItemId, serialNumber);
  }
  
  console.log(`✅ Serienummer ${serialNumber} toegevoegd aan runtime database als ${type} ${tuning} (${frequency}Hz)`);
  return true;
}

/**
 * DEZE FUNCTIE IS VERWIJDERD OMDAT HET DIRECT RAADPLEGEN VAN DE DATABASE EFFICIËNTER IS
 * 
 * Gebruik in plaats daarvan:
 * 
 * if (serialNumber in SERIAL_NUMBER_DATABASE) {
 *   const dbSpecs = SERIAL_NUMBER_DATABASE[serialNumber];
 *   // Gebruik dbSpecs.type, dbSpecs.tuning, enz.
 * }
 * 
 * Dit voorkomt de fout "Cannot access uninitialized variable"
 */

/**
 * Haalt het type op uit de specificaties, controleert eerst de serienummerdatabase
 * @param serialNumber Het betreffende serienummer 
 * @param specifications De huidige specificaties
 * @returns Het verbeterde type
 */
export function getTypeFromSpecifications(serialNumber: string, specifications: any): string {
  // Verwijder de "SW-" prefix als die bestaat
  const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
  
  // Controleer eerst de vaste database
  if (normalizedSerialNumber in SERIAL_NUMBER_DATABASE) {
    return SERIAL_NUMBER_DATABASE[normalizedSerialNumber].type;
  }
  
  // Controleer de runtime toevoegingen (alleen op de server)
  if (typeof SERVER_SERIAL_NUMBER_ADDITIONS === 'object' && 
      normalizedSerialNumber in SERVER_SERIAL_NUMBER_ADDITIONS) {
    return SERVER_SERIAL_NUMBER_ADDITIONS[normalizedSerialNumber].type;
  }
  
  // Gebruik de specificaties van het item zelf
  if (specifications.fluteType) {
    return specifications.fluteType;
  }
  
  // Probeer het type af te leiden uit de titel of omschrijving
  const title = specifications.title || '';
  
  if (title.includes('NATEY') || title.includes('Natey')) {
    return 'NATEY';
  } else if (title.includes('INNATO') || title.includes('Innato')) {
    return 'INNATO';
  } else if (title.includes('DOUBLE') || title.includes('Double')) {
    return 'DOUBLE';
  } else if (title.includes('ZEN') || title.includes('Zen')) {
    return 'ZEN';
  } else if (title.includes('CARDS') || title.includes('Cards')) {
    return 'CARDS';
  }
  
  // Fallback
  return 'UNKNOWN';
}

/**
 * Controleert de integriteit van een serienummer en retourneert de correcte specificaties
 * Bepaalt aan de hand van de centrale database of de specificaties aangepast moeten worden
 * 
 * @param serialNumber Het serienummer dat moet worden gecontroleerd
 * @param currentSpecs De huidige specificaties van dit serienummer
 * @returns De gecorrigeerde specificaties, of de originele indien geen correctie nodig is
 */
export function checkSerialNumberIntegrity(serialNumber: string, currentSpecs: Record<string, string>): Record<string, string> {
  // Verwijder de "SW-" prefix als die bestaat
  const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
  
  // Clone de huidige specificaties
  const fixedSpecs = { ...currentSpecs };
  
  // Controleer eerst de vaste database
  if (normalizedSerialNumber in SERIAL_NUMBER_DATABASE) {
    console.log(`✅ SERIENUMMER DATABASE: ${serialNumber} gevonden, vaste waardes toepassen`);
    console.log(`📋 SERIENUMMER SPECS SW-${normalizedSerialNumber}: ${JSON.stringify(SERIAL_NUMBER_DATABASE[normalizedSerialNumber])}`);
    
    // Log voor debugging wat we aanpassen
    console.log(`🔄 SERIENUMMER VOORHEEN: itemType=${fixedSpecs.type || fixedSpecs.model || fixedSpecs.fluteType}, tuningType=${fixedSpecs.tuning}`);
    
    // Pas de specificaties aan op basis van de database
    const dbSpecs = SERIAL_NUMBER_DATABASE[normalizedSerialNumber];
    
    // Zet de juiste fluteType en type
    fixedSpecs.fluteType = dbSpecs.type;
    fixedSpecs.type = dbSpecs.type;
    fixedSpecs.model = dbSpecs.type;
    
    // Zet de juiste tuning
    fixedSpecs.tuning = dbSpecs.tuning;
    
    // Zet kleur als die in de database staat
    if (dbSpecs.color) {
      fixedSpecs.color = dbSpecs.color;
    }
    
    // Zet frequentie als die in de database staat
    if (dbSpecs.frequency) {
      fixedSpecs.frequency = dbSpecs.frequency;
      
      // Zet ook de tuningFrequency om compatibel te blijven met frontend
      if (dbSpecs.frequency === '432') {
        fixedSpecs.tuningFrequency = '432';
      } else if (dbSpecs.frequency === '440') {
        fixedSpecs.tuningFrequency = '440';
      }
    }
    
    console.log(`🔄 SERIENUMMER NADERHAND: itemType=${fixedSpecs.type}, tuningType=${fixedSpecs.tuning}`);
    console.log(`🔍 VERRIJKTE SPECS: ${JSON.stringify(fixedSpecs)}`);
    
    return fixedSpecs;
  }
  
  // Controleer de runtime toevoegingen (alleen op de server)
  if (typeof SERVER_SERIAL_NUMBER_ADDITIONS === 'object' && 
      normalizedSerialNumber in SERVER_SERIAL_NUMBER_ADDITIONS) {
    console.log(`✅ SERIENUMMER RUNTIME: ${serialNumber} gevonden in runtime database, waarden toepassen`);
    
    // Pas de specificaties aan op basis van de runtime database
    const runtimeSpecs = SERVER_SERIAL_NUMBER_ADDITIONS[normalizedSerialNumber];
    
    // Zet de juiste fluteType en type
    fixedSpecs.fluteType = runtimeSpecs.type;
    fixedSpecs.type = runtimeSpecs.type;
    fixedSpecs.model = runtimeSpecs.type;
    
    // Zet de juiste tuning
    fixedSpecs.tuning = runtimeSpecs.tuning;
    
    // Zet kleur als die in de database staat
    if (runtimeSpecs.color) {
      fixedSpecs.color = runtimeSpecs.color;
    }
    
    // Zet frequentie als die in de database staat
    if (runtimeSpecs.frequency) {
      fixedSpecs.frequency = runtimeSpecs.frequency;
      
      // Zet ook de tuningFrequency om compatibel te blijven met frontend
      if (runtimeSpecs.frequency === '432') {
        fixedSpecs.tuningFrequency = '432';
      } else if (runtimeSpecs.frequency === '440') {
        fixedSpecs.tuningFrequency = '440';
      }
    }
    
    return fixedSpecs;
  }
  
  // Geen correctie nodig
  return currentSpecs;
}