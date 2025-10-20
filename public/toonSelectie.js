/**
 * Toon Selectie knop script
 * Dit script voegt een knop toe die geselecteerde items toont/verbergt
 */

// Deze functie probeert periodiek de filterContainer te vinden en de knop toe te voegen
function initialiseerSelectieKnop() {
  console.log('Toon selectie initialisatie gestart...');
  
  // Functie die toevoegen blijft proberen tot het lukt
  function proberenKnopToeTevoegen() {
    console.log('Poging om de knop toe te voegen...');
    
    // De container moet zichtbaar zijn - probeer verschillende selectors
    const filterContainer = 
      document.querySelector('.flex.flex-wrap.gap-1.items-center.mb-0\\.5.bg-gray-50.p-0\\.5') || 
      document.querySelector('.flex.flex-wrap.gap-1.items-center');
    
    // Als we de container niet kunnen vinden, probeer het later opnieuw
    if (!filterContainer) {
      console.log('Filter container nog niet gevonden, opnieuw proberen over 1 seconde');
      setTimeout(proberenKnopToeTevoegen, 1000);
      return;
    }
    
    // Controleer of de knop al bestaat (voorkom duplicaten)
    if (document.getElementById('toon-selectie-knop')) {
      console.log('Knop bestaat al, niet opnieuw toevoegen');
      return;
    }
    
    console.log('Filter container gevonden, knop toevoegen...');
    
    // Maak de knop
    const button = document.createElement('button');
    button.id = 'toon-selectie-knop';
    button.type = 'button';
    button.style.zIndex = '9999';
    button.style.margin = '0 4px';
    button.style.height = '28px';
    button.style.padding = '2px 8px';
    button.style.borderRadius = '6px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.backgroundColor = '#dbeafe';
    button.style.color = '#1e40af';
    button.style.border = '1px solid #3b82f6';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s';
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height:12px;width:12px;margin-right:4px">
        <polyline points="9 11 12 14 22 4"></polyline>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
      </svg>
      <span style="font-size:12px;white-space:nowrap;">Toon selectie</span>
    `;
    
    // Voeg de knop toe als eerste kind in de container
    filterContainer.insertBefore(button, filterContainer.firstChild);
    
    console.log('Knop toegevoegd, event listener toevoegen...');
    
    // Houd bij of we in "toon selectie" modus zijn
    let toonSelectieModus = false;
    
    // Voeg click event handler toe
    button.addEventListener('click', function(event) {
      // Voorkom dat andere event handlers worden aangeroepen
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Toon selectie knop geklikt');
      
      // Verzamel alle rijen en geselecteerde checkboxes
      const alleRijen = document.querySelectorAll('tr.order-row');
      const geselecteerdeCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      
      console.log(`Aantal rijen: ${alleRijen.length}, aantal geselecteerde checkboxes: ${geselecteerdeCheckboxes.length}`);
      
      // Als er geen geselecteerde items zijn, toon een waarschuwing
      if (geselecteerdeCheckboxes.length === 0) {
        alert('Geen items geselecteerd!');
        return;
      }
      
      // Verzamel alle geselecteerde rijen
      const geselecteerdeRijen = [];
      geselecteerdeCheckboxes.forEach(function(checkbox) {
        const rij = checkbox.closest('tr');
        if (rij) {
          geselecteerdeRijen.push(rij);
        }
      });
      
      console.log(`Aantal gevonden geselecteerde rijen: ${geselecteerdeRijen.length}`);
      
      // Wissel tussen tonen van alle rijen en alleen geselecteerde rijen
      if (toonSelectieModus) {
        // Toon alle rijen weer
        alleRijen.forEach(function(rij) {
          rij.style.display = '';
        });
        
        // Update knop uiterlijk
        button.style.backgroundColor = '#dbeafe';
        button.style.color = '#1e40af';
        button.querySelector('span').textContent = 'Toon selectie';
        
        // Update status
        toonSelectieModus = false;
      } else {
        // Verberg alle rijen
        alleRijen.forEach(function(rij) {
          rij.style.display = 'none';
        });
        
        // Toon alleen geselecteerde rijen
        geselecteerdeRijen.forEach(function(rij) {
          rij.style.display = '';
        });
        
        // Update knop uiterlijk
        button.style.backgroundColor = '#3b82f6';
        button.style.color = 'white';
        button.querySelector('span').textContent = 'Toon alle items';
        
        // Update status
        toonSelectieModus = true;
      }
      
      return false;
    });
    
    console.log('Toon selectie knop setup voltooid!');
  }
  
  // Start met proberen na korte vertraging (wacht tot React de UI heeft gerenderd)
  setTimeout(proberenKnopToeTevoegen, 1000);
}

// Voer de initialisatie uit wanneer de pagina volledig is geladen
window.addEventListener('load', initialiseerSelectieKnop);

// Als fallback, probeer ook op DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initialiseerSelectieKnop, 500);
});

// Extra fallback - probeer het direct 
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initialiseerSelectieKnop, 100);
}