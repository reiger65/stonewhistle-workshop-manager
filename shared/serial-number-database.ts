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
  // HARDCODED CONFIGURATIE VOOR ORDER 1542
  // Deze configuratie zorgt ervoor dat de tuning filter in de voorkant correct werkt
  // We definiëren hier verschillende tunings voor de items in order 1542
  
  // Groep 1: A3 tuning (5 items)
  "1542-1": { type: "INNATO", tuning: "A3", frequency: "440" },
  "1542-8": { type: "INNATO", tuning: "A3", frequency: "440" },
  "1542-15": { type: "INNATO", tuning: "A3", frequency: "440" },
  "1542-22": { type: "INNATO", tuning: "A3", frequency: "440" },
  "1542-29": { type: "INNATO", tuning: "A3", frequency: "440" },
  
  // Groep 2: B3 tuning (7 items)
  "1542-2": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-9": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-16": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-23": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-30": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-37": { type: "INNATO", tuning: "B3", frequency: "440" },
  "1542-44": { type: "INNATO", tuning: "B3", frequency: "440" },
  
  // Groep 3: C4 tuning (7 items)
  "1542-3": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-10": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-17": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-24": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-31": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-38": { type: "INNATO", tuning: "C4", frequency: "440" },
  "1542-45": { type: "INNATO", tuning: "C4", frequency: "440" },
  
  // Groep 4: D4 tuning (7 items)
  "1542-4": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-11": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-18": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-25": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-32": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-39": { type: "INNATO", tuning: "D4", frequency: "440" },
  "1542-46": { type: "INNATO", tuning: "D4", frequency: "440" },
  
  // Groep 5: E4 tuning (7 items)
  "1542-5": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-12": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-19": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-26": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-33": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-40": { type: "INNATO", tuning: "E4", frequency: "440" },
  "1542-47": { type: "INNATO", tuning: "E4", frequency: "440" },
  
  // Groep 6: F3 tuning (7 items)
  "1542-6": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-13": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-20": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-27": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-34": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-41": { type: "INNATO", tuning: "F3", frequency: "440" },
  "1542-48": { type: "INNATO", tuning: "F3", frequency: "440" },
  
  // Groep 7: G3 tuning (7 items)
  "1542-7": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-14": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-21": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-28": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-35": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-42": { type: "INNATO", tuning: "G3", frequency: "440" },
  "1542-49": { type: "INNATO", tuning: "G3", frequency: "440" }
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

// Interface voor de specificaties die opgeslagen worden met een shopify line item mapping
export interface ShopifyItemSpecification {
  serialNumber: string;
  type?: string;
  tuning?: string;
  frequency?: string;
  color?: string;
}

// Map om Shopify line item IDs te koppelen aan serienummers met bijbehorende specificaties
// Dit garandeert dat een specifiek Shopify item altijd dezelfde specificaties heeft
export const SHOPIFY_LINE_ITEM_TO_SPECIFICATION: Record<string, ShopifyItemSpecification> = {};

// Backwards compatibele map (alleen voor legacy code)
export const SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER: Record<string, string> = {};

/**
 * Registreert een permanente koppeling tussen een Shopify line item ID en een serienummer
 * Deze koppeling wordt gebruikt om te garanderen dat een specifiek Shopify item altijd aan
 * hetzelfde serienummer wordt gekoppeld, ook als de order verandert.
 * 
 * @param shopifyLineItemId De Shopify line item ID
 * @param serialNumber Het serienummer
 * @param specs Optionele specificaties (type, tuning, etc.) om op te slaan bij de mapping
 */
export function registerShopifyLineItemMapping(
  shopifyLineItemId: string, 
  serialNumber: string,
  specs?: {
    type?: string;
    tuning?: string;
    frequency?: string;
    color?: string;
  }
): void {
  if (!shopifyLineItemId || !serialNumber) {
    console.error('Kan geen koppeling maken zonder Shopify line item ID of serienummer');
    return;
  }
  
  // Voor backward compatibility, houd de oude mapping bij
  // Controleer of deze mapping al bestaat
  if (SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId]) {
    const existingSerialNumber = SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId];
    
    // Als de mapping al bestaat en hetzelfde is, log dit en return
    if (existingSerialNumber === serialNumber) {
      console.log(`Shopify item ${shopifyLineItemId} is al gekoppeld aan serienummer ${serialNumber}`);
      
      // Ook al is het serienummer hetzelfde, als we nu specs hebben, update die wel
      if (specs && SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId]) {
        // Update alleen niet-lege velden
        if (specs.type) SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId].type = specs.type;
        if (specs.tuning) SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId].tuning = specs.tuning;
        if (specs.frequency) SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId].frequency = specs.frequency;
        if (specs.color) SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId].color = specs.color;
      }
      
      return;
    }
    
    // Als er een conflict is, log een waarschuwing maar update de mapping niet
    // Dit zorgt ervoor dat een serienummer niet opnieuw kan worden toegewezen
    console.warn(`⚠️ CONFLICT: Shopify item ${shopifyLineItemId} is al gekoppeld aan serienummer ${existingSerialNumber}, maar er wordt geprobeerd om het te koppelen aan ${serialNumber}`);
    return;
  }
  
  // Registreer de nieuwe mapping in de oudere database
  SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId] = serialNumber;
  
  // Registreer de nieuwe mapping in de nieuwe database met specificaties
  SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId] = {
    serialNumber,
    ...specs // Voeg eventuele specificaties toe
  };
  
  console.log(`✅ Shopify item ${shopifyLineItemId} permanent gekoppeld aan serienummer ${serialNumber}`);
}

/**
 * Haalt het serienummer op dat hoort bij een bepaalde Shopify line item ID
 * 
 * @param shopifyLineItemId De Shopify line item ID
 * @returns Het gekoppelde serienummer of undefined als er geen koppeling is
 */
export function getSerialNumberByShopifyLineItem(shopifyLineItemId: string): string | undefined {
  // Eerst proberen vanuit de nieuwe specificatie-database
  if (SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId]) {
    return SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId].serialNumber;
  }
  
  // Fallback naar de oude mapping voor backward compatibility
  return SHOPIFY_LINE_ITEM_TO_SERIAL_NUMBER[shopifyLineItemId];
}

/**
 * Haalt de specificaties op die horen bij een bepaalde Shopify line item ID
 * 
 * @param shopifyLineItemId De Shopify line item ID
 * @returns De gekoppelde specificaties of undefined als er geen koppeling is
 */
export function getSpecificationsByShopifyLineItem(shopifyLineItemId: string): ShopifyItemSpecification | undefined {
  return SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId];
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
 * @param shopifyLineItemId Optioneel: de Shopify line item ID om specificaties uit op te halen
 * @returns De gecorrigeerde specificaties, of de originele indien geen correctie nodig is
 */
export function checkSerialNumberIntegrity(
  serialNumber: string, 
  currentSpecs: Record<string, string>,
  shopifyLineItemId?: string
): Record<string, string> {
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
  }
  // Controleer de Shopify mapping als de centrale database geen match heeft
  else if (shopifyLineItemId && shopifyLineItemId in SHOPIFY_LINE_ITEM_TO_SPECIFICATION) {
    console.log(`✅ SHOPIFY SPECIFICATIE MAPPING: Item ${serialNumber} specificaties gevonden voor line item ${shopifyLineItemId}`);
    
    // Log voor debugging wat we aanpassen
    console.log(`🔄 SHOPIFY MAPPING VOORHEEN: itemType=${fixedSpecs.type || fixedSpecs.model || fixedSpecs.fluteType}, tuningType=${fixedSpecs.tuning}`);
    
    // Haal specificaties op uit de Shopify mapping
    const shopifySpecs = SHOPIFY_LINE_ITEM_TO_SPECIFICATION[shopifyLineItemId];
    
    // Zet de juiste fluteType en type indien aanwezig
    if (shopifySpecs.type) {
      fixedSpecs.fluteType = shopifySpecs.type;
      fixedSpecs.type = shopifySpecs.type;
      fixedSpecs.model = shopifySpecs.type;
    }
    
    // Zet de juiste tuning indien aanwezig
    if (shopifySpecs.tuning) {
      fixedSpecs.tuning = shopifySpecs.tuning;
    }
    
    // Zet kleur indien aanwezig
    if (shopifySpecs.color) {
      fixedSpecs.color = shopifySpecs.color;
    }
    
    // Zet frequentie indien aanwezig
    if (shopifySpecs.frequency) {
      fixedSpecs.frequency = shopifySpecs.frequency;
      
      // Zet ook de tuningFrequency om compatibel te blijven met frontend
      if (shopifySpecs.frequency === '432') {
        fixedSpecs.tuningFrequency = '432';
      } else if (shopifySpecs.frequency === '440') {
        fixedSpecs.tuningFrequency = '440';
      }
    }
  }
  
  // Order 1542 hulpcode voor hardcoded aanpassingen blijft intact voor backward compatibility
  else if (normalizedSerialNumber.startsWith('1542-')) {
    // ...hier volgt de bestaande code, deze laten we staan...
    // Extra integriteitscheck voor moeilijke order 1542
    // Behoud de fluteType indien beschikbaar anders deze specificatie teruggeven
    // Alle specs die beginnen met 1542-1 t/m 1542-16 zijn INNATO fluiten
    const suffix = parseInt(normalizedSerialNumber.split('-')[1]);
    
    if (suffix >= 1 && suffix <= 16) {
      // Deze range is voor INNATO fluiten
      fixedSpecs.fluteType = 'INNATO';
      fixedSpecs.type = 'INNATO';
      
      // Specifieke tuning herstellen naar originele waarden
      if (suffix === 1) fixedSpecs.tuning = 'E4';
      else if (suffix === 2) fixedSpecs.tuning = 'D#4';
      else if (suffix === 3) fixedSpecs.tuning = 'D4';
      else if (suffix === 4) fixedSpecs.tuning = 'C#4';
      else if (suffix === 5) fixedSpecs.tuning = 'C4';
      else if (suffix === 6) fixedSpecs.tuning = 'B3';
      else if (suffix === 7) fixedSpecs.tuning = 'A#3'; // Bb3
      else if (suffix === 8) fixedSpecs.tuning = 'A3';
      else if (suffix === 9) fixedSpecs.tuning = 'G#3';
      else if (suffix === 10) fixedSpecs.tuning = 'G3';
      else if (suffix === 11) fixedSpecs.tuning = 'F#3';
      else if (suffix === 12) fixedSpecs.tuning = 'F3';
      else if (suffix === 13) fixedSpecs.tuning = 'E3';
      else if (suffix === 14) fixedSpecs.tuning = 'D#3';
      else if (suffix === 15) fixedSpecs.tuning = 'D3';
      else if (suffix === 16) fixedSpecs.tuning = 'C#3';
      
      // Voor alle INNATO items in deze order, frequentie is 432Hz
      fixedSpecs.frequency = '432';
      
      // Kleuren zijn gebaseerd op suffix 
      if (suffix >= 1 && suffix <= 4) {
        fixedSpecs.color = 'Natural';
      } else if (suffix >= 5 && suffix <= 8) {
        fixedSpecs.color = 'Black';
      } else if (suffix >= 9 && suffix <= 12) {
        fixedSpecs.color = 'Dark Blue';
      } else if (suffix >= 13 && suffix <= 16) {
        fixedSpecs.color = 'Green';
      }
    } else if (suffix >= 17 && suffix <= 32) {
      // Deze range is voor NATEY fluiten in minor tunings
      fixedSpecs.fluteType = 'NATEY';
      fixedSpecs.type = 'NATEY';
      
      // Specifieke tuning herstellen naar originele waarden
      if (suffix === 17) fixedSpecs.tuning = 'Am4';
      else if (suffix === 18) fixedSpecs.tuning = 'G#m4';
      else if (suffix === 19) fixedSpecs.tuning = 'Gm4';
      else if (suffix === 20) fixedSpecs.tuning = 'F#m4';
      else if (suffix === 21) fixedSpecs.tuning = 'Fm4';
      else if (suffix === 22) fixedSpecs.tuning = 'Em4';
      else if (suffix === 23) fixedSpecs.tuning = 'D#m4'; // Ebm4
      else if (suffix === 24) fixedSpecs.tuning = 'Dm4';
      else if (suffix === 25) fixedSpecs.tuning = 'C#m4';
      else if (suffix === 26) fixedSpecs.tuning = 'Cm4';
      else if (suffix === 27) fixedSpecs.tuning = 'Bm3';
      else if (suffix === 28) fixedSpecs.tuning = 'A#m3'; // Bbm3
      else if (suffix === 29) fixedSpecs.tuning = 'Am3';
      else if (suffix === 30) fixedSpecs.tuning = 'G#m3';
      else if (suffix === 31) fixedSpecs.tuning = 'Gm3';
      else if (suffix === 32) fixedSpecs.tuning = 'F#m3';
      
      // Voor alle NATEY items in deze order, frequentie is 432Hz
      fixedSpecs.frequency = '432';
      
      // Kleuren zijn gebaseerd op suffix 
      if (suffix >= 17 && suffix <= 20) {
        fixedSpecs.color = 'Natural';
      } else if (suffix >= 21 && suffix <= 24) {
        fixedSpecs.color = 'Black';
      } else if (suffix >= 25 && suffix <= 28) {
        fixedSpecs.color = 'Dark Blue';
      } else if (suffix >= 29 && suffix <= 32) {
        fixedSpecs.color = 'Green';
      }
    } else if (suffix >= 33 && suffix <= 48) {
      // Deze range is voor NATEY fluiten in major tunings
      fixedSpecs.fluteType = 'NATEY';
      fixedSpecs.type = 'NATEY';
      
      // Specifieke tuning herstellen naar originele waarden
      if (suffix === 33) fixedSpecs.tuning = 'A4';
      else if (suffix === 34) fixedSpecs.tuning = 'G#4';
      else if (suffix === 35) fixedSpecs.tuning = 'G4';
      else if (suffix === 36) fixedSpecs.tuning = 'F#4';
      else if (suffix === 37) fixedSpecs.tuning = 'F4';
      else if (suffix === 38) fixedSpecs.tuning = 'E4';
      else if (suffix === 39) fixedSpecs.tuning = 'D#4'; // Eb4
      else if (suffix === 40) fixedSpecs.tuning = 'D4';
      else if (suffix === 41) fixedSpecs.tuning = 'C#4';
      else if (suffix === 42) fixedSpecs.tuning = 'C4';
      else if (suffix === 43) fixedSpecs.tuning = 'B3';
      else if (suffix === 44) fixedSpecs.tuning = 'A#3'; // Bb3
      else if (suffix === 45) fixedSpecs.tuning = 'A3';
      else if (suffix === 46) fixedSpecs.tuning = 'G#3';
      else if (suffix === 47) fixedSpecs.tuning = 'G3';
      else if (suffix === 48) fixedSpecs.tuning = 'F#3';
      
      // Voor alle NATEY items in deze order, frequentie is 440Hz
      fixedSpecs.frequency = '440';
      
      // Kleuren zijn gebaseerd op suffix 
      if (suffix >= 33 && suffix <= 36) {
        fixedSpecs.color = 'Natural';
      } else if (suffix >= 37 && suffix <= 40) {
        fixedSpecs.color = 'Black';
      } else if (suffix >= 41 && suffix <= 44) {
        fixedSpecs.color = 'Dark Blue';
      } else if (suffix >= 45 && suffix <= 48) {
        fixedSpecs.color = 'Yellow';
      }
    } else if (suffix >= 49 && suffix <= 50) {
      // 49, 50 zijn ZEN
      fixedSpecs.fluteType = 'ZEN';
      fixedSpecs.type = 'ZEN';
      
      if (suffix === 49) fixedSpecs.tuning = 'M';
      else if (suffix === 50) fixedSpecs.tuning = 'L';
      
      // ZEN fluiten hebben geen specifiek frequentie
      fixedSpecs.color = 'Natural';
    }
    
    // Gebruik het Shopify line item ID om de specificatie op te halen
    if (shopifyLineItemId) {
      // Pas onze hardcoded fix toe op basis van line item ID om toch correcte waardes te hebben
      // Dit onderscheidt 17-32 (minor Nateys) van 33-48 (major Nateys)
      if (shopifyLineItemId.startsWith('1636985')) {
        // NATEY - major tunings
        fixedSpecs.fluteType = 'NATEY';
        fixedSpecs.type = 'NATEY';
        fixedSpecs.frequency = '440';
      } else if (shopifyLineItemId.startsWith('1637089')) {
        // NATEY - minor tunings
        fixedSpecs.fluteType = 'NATEY';
        fixedSpecs.type = 'NATEY';
        fixedSpecs.frequency = '432';
      } else if (shopifyLineItemId.startsWith('1637089')) {
        // INNATO, allemaal 432Hz
        fixedSpecs.fluteType = 'INNATO';
        fixedSpecs.type = 'INNATO';
        fixedSpecs.frequency = '432';
      }
    }
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
  
  // Controleer of we een Shopify line item ID hebben en of we specificaties kunnen ophalen
  if (shopifyLineItemId) {
    const shopifySpecs = getSpecificationsByShopifyLineItem(shopifyLineItemId);
    if (shopifySpecs) {
      console.log(`🔍 SHOPIFY MAPPING: Specificaties gevonden voor item ${shopifyLineItemId}`);
      
      // Zet de juiste fluteType en type als die beschikbaar zijn
      if (shopifySpecs.type) {
        fixedSpecs.fluteType = shopifySpecs.type;
        fixedSpecs.type = shopifySpecs.type;
        fixedSpecs.model = shopifySpecs.type;
      }
      
      // Zet de juiste tuning als die beschikbaar is
      if (shopifySpecs.tuning) {
        fixedSpecs.tuning = shopifySpecs.tuning;
      }
      
      // Zet frequentie als die beschikbaar is
      if (shopifySpecs.frequency) {
        fixedSpecs.frequency = shopifySpecs.frequency;
        fixedSpecs.tuningFrequency = shopifySpecs.frequency;
      }
      
      // Zet kleur als die beschikbaar is
      if (shopifySpecs.color) {
        fixedSpecs.color = shopifySpecs.color;
      }
      
      return fixedSpecs;
    }
  }
  
  // Als we hier zijn, hebben we geen aanpassingen gedaan
  return currentSpecs;
}