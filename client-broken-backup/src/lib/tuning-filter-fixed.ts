/**
 * This file contains all the tuning filtering code using the utility functions
 * Copy the code below and paste it into worksheet.tsx
 */

// Stap 2.6: Tuning filter toepassen - NIEUWE GESTRUCTUREERDE VERSIE MET UTILS
const tuningFilteredOrderIds = new Set<number>();

if (tuningFilter !== null) {
  console.log(`GESTRUCTUREERDE TUNING FILTER: Filteren op tuning "${tuningFilter}"`);
  
  // Gebruik de nieuwe filtering utils
  colorFilteredOrderIds.forEach(orderId => {
    const orderItems = itemsByOrderForFiltering[orderId];
    
    // Check of minstens één item in de order de gevraagde tuning heeft
    const hasMatchingTuning = orderItems.some(item => {
      try {
        // Haal het instrument type op
        const instrumentType = detectInstrumentType(item);
        
        // Haal de tuning van het instrument op via onze gestructureerde functie
        const itemTuning = getInstrumentTuning(item);
        
        // Als er geen tuning gevonden is, geen match
        if (itemTuning === null) return false;
        
        // Gebruik de tuning vergelijkingsfunctie die rekening houdt met instrument-specifieke regels
        const isMatch = isTuningSimilar(itemTuning, tuningFilter, instrumentType);
        
        if (isMatch) {
          console.log(`✅ MATCH: Item ${item.id} (${item.serialNumber || 'geen SN'}) met tuning ${itemTuning} matcht met filter ${tuningFilter}`);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Fout bij tuning filtering:', error);
        return false;
      }
    });
    
    if (hasMatchingTuning) {
      tuningFilteredOrderIds.add(orderId);
    }
  });
} else {
  // Als er geen tuning filter is, gebruik alle orders na color filtering
  colorFilteredOrderIds.forEach(orderId => tuningFilteredOrderIds.add(orderId));
}