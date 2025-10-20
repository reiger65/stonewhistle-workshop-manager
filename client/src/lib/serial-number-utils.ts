/**
 * Serienummer utilities voor het consistent weergeven van fluit specificaties
 * op basis van de SERIAL_NUMBER_DATABASE
 */

// Importeer de centrale database (client-side kopie)
import { SERIAL_NUMBER_DATABASE } from '@shared/serial-number-database';
import { OrderItem } from '@shared/schema';

/**
 * Veilige manier om gegevens uit de SERIAL_NUMBER_DATABASE te halen
 * Dit voorkomt problemen met directe toegang tot de database wanneer deze niet geladen is
 * 
 * @param serialNumber Het serienummer waarvan je de gegevens wilt ophalen
 * @returns De specificaties uit de database of undefined als het niet gevonden is
 */
export function safeGetFromSerialNumberDatabase(serialNumber: string): {
  type: string;
  tuning: string;
  frequency?: string;
  color?: string;
} | undefined {
  if (!serialNumber) return undefined;
  
  try {
    // Controleer of de database beschikbaar is
    if (typeof SERIAL_NUMBER_DATABASE === 'object' && SERIAL_NUMBER_DATABASE !== null) {
      // Verwijder de "SW-" prefix als die bestaat voor databaseraadpleging
      const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
      
      // Verbeterde multi-item order lookup
      if (serialNumber.includes('-')) {
        // Split het serienummer in delen
        const parts = serialNumber.split('-');
        
        // Als het serienummer het formaat SW-XXXX-Y heeft
        if (parts.length === 3) {
          // Haal orderNr en suffix
          const orderNr = parts[1];
          const suffix = parts[2];
          
          // Zoek eerst met orderNr-suffix (bijv. 1542-2)
          const alternativeKey = `${orderNr}-${suffix}`;
          
          console.log(`🔍 Multi-item: Zoek ${serialNumber} als ${alternativeKey}`);
          
          if (alternativeKey in SERIAL_NUMBER_DATABASE) {
            console.log(`✅ Multi-item gevonden: ${serialNumber} => ${alternativeKey}`);
            return SERIAL_NUMBER_DATABASE[alternativeKey];
          }
        }
      }
      
      // Reguliere check voor database
      if (normalizedSerialNumber in SERIAL_NUMBER_DATABASE) {
        console.log(`🔍 Serienummer ${serialNumber} gevonden in database als ${normalizedSerialNumber}`);
        return SERIAL_NUMBER_DATABASE[normalizedSerialNumber];
      }
      
      // Als we hier komen is er geen exacte match, probeer het serienummer te splitsen
      // Het formaat is meestal "ordernummer-suffix", bijv. "1542-2"
      const match = normalizedSerialNumber.match(/^(\d+)-(\d+)$/);
      if (match) {
        const [_, orderNumber, suffix] = match;
        const key = `${orderNumber}-${suffix}`;
        
        if (key in SERIAL_NUMBER_DATABASE) {
          console.log(`✅ Serienummer ${serialNumber} gevonden via suffix-methode als ${key}`);
          return SERIAL_NUMBER_DATABASE[key];
        }
      }
    }
  } catch (error) {
    console.error(`Fout bij ophalen van serienummer ${serialNumber} uit database:`, error);
  }
  
  return undefined;
}

/**
 * Controleert of een serienummer in de centrale database staat
 * @param serialNumber Het te controleren serienummer
 * @returns True als het serienummer in de database staat
 */
export function isSerialNumberInDatabase(serialNumber: string): boolean {
  if (!serialNumber) return false;
  
  const result = safeGetFromSerialNumberDatabase(serialNumber) !== undefined;
  
  // Hier was voorheen een speciale hardcoded behandeling voor 1542-2
  // Die is nu verwijderd omdat de structurele oplossing dit overbodig maakt
  
  return result;
}

/**
 * Haalt de gestandardiseerde specificaties op voor een serienummer
 * @param serialNumber Het serienummer waarvoor specificaties worden opgevraagd
 * @returns De gestandardiseerde specificaties of null als het serienummer niet in de database staat
 */
export function getStandardizedSpecifications(serialNumber: string): {
  type: string;
  tuning: string;
  frequency?: string;
  color?: string;
} | null {
  const specs = safeGetFromSerialNumberDatabase(serialNumber);
  return specs || null;
}

/**
 * Krijg de definitieve specificaties voor een OrderItem, waarbij de serienummerdatabase
 * altijd voorrang heeft boven de specificaties in het orderitem zelf
 * 
 * @param item Het OrderItem waarvan we de specificaties willen weten
 * @returns Een object met de definitieve specificaties
 */
export function getDefinitiveSpecifications(item: OrderItem): {
  type: string;
  tuning: string;
  frequency?: string;
  color?: string;
} {
  // Controleer eerst of we deze in de serienummerdatabase kunnen vinden
  if (item.serialNumber) {
    const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
    if (dbSpecs) {
      // We hebben een exacte match in de database, gebruik deze als bron van waarheid
      return {
        type: dbSpecs.type,
        tuning: dbSpecs.tuning,
        frequency: dbSpecs.frequency,
        color: dbSpecs.color
      };
    }
  }
  
  // Als we hier zijn, hebben we geen match gevonden in de database
  // Gebruik dan de specificaties van het orderitem zelf
  const specs = item.specifications || {};
  
  // Bepaal het type - dit kan in verschillende velden zitten
  const type = specs.fluteType || specs.model || specs.type || 
               (item.itemType && item.itemType.split(' ')[0]) || 'UNKNOWN';
               
  // Bepaal de tuning - dit zit meestal in het tuning veld
  const tuning = specs.tuning || specs.note || 
                (item.itemType && item.itemType.split(' ')[1]) || 'UNKNOWN';
                
  // Bepaal de frequency
  const frequency = specs.frequency || specs.tuningFrequency || '432';
  
  // Bepaal de kleur
  const color = specs.color || '';
  
  return { type, tuning, frequency, color };
}

/**
 * Verrijkt een orderitem met de correcte specificaties uit de database
 * @param item Het orderitem dat verrijkt moet worden
 * @returns Een nieuw orderitem met de correcte specificaties
 */
export function enrichOrderItemWithDatabaseSpecs(item: OrderItem): OrderItem {
  if (!item.serialNumber || !isSerialNumberInDatabase(item.serialNumber)) {
    return item;
  }
  
  // Haal de gestandaardiseerde specificaties op met de veilige helper functie
  const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
  
  // Als de database specificaties niet beschikbaar zijn, return het originele item
  if (!dbSpecs) {
    console.warn(`Kon serienummer ${item.serialNumber} niet vinden in database voor verrijking`);
    return item;
  }
  
  // Controleer of de huidige specificaties afwijken van de database specificaties
  let needsEnrichment = false;
  if (item.specifications) {
    const currentType = item.specifications.fluteType || item.specifications.model || item.specifications.type;
    const currentTuning = item.specifications.tuning;
    
    if (currentType !== dbSpecs.type || currentTuning !== dbSpecs.tuning) {
      console.log(`SERIENUMMER CORRECTIE: ${item.serialNumber} was ${currentType} ${currentTuning}, nu gecorrigeerd naar ${dbSpecs.type} ${dbSpecs.tuning}`);
      needsEnrichment = true;
    }
  } else {
    needsEnrichment = true;
  }
  
  if (!needsEnrichment) {
    return item; // Geen wijzigingen nodig
  }
  
  // Maak kopie van het item
  const enrichedItem = { ...item };
  
  // Enrich het itemType veld met de correcte type en tuning
  enrichedItem.itemType = `${dbSpecs.type} ${dbSpecs.tuning}`;
  
  // Enrich de specificaties
  if (enrichedItem.specifications) {
    enrichedItem.specifications = {
      ...enrichedItem.specifications,
      fluteType: dbSpecs.type,
      type: dbSpecs.type,
      model: dbSpecs.type,
      tuning: dbSpecs.tuning,
      frequency: dbSpecs.frequency || enrichedItem.specifications.frequency,
      color: dbSpecs.color || enrichedItem.specifications.color
    };
  }
  
  return enrichedItem;
}

/**
 * Verrijkt een array van orderitems met de correcte specificaties uit de database
 * @param items De array van orderitems die verrijkt moeten worden
 * @returns Een nieuwe array met verrijkte orderitems
 */
export function enrichOrderItemsWithDatabaseSpecs(items: OrderItem[]): OrderItem[] {
  if (!items || !Array.isArray(items)) return items;
  
  return items.map(item => enrichOrderItemWithDatabaseSpecs(item));
}