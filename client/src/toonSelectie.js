/**
 * Voegt een "Toon Selectie" knop toe aan het filter panel
 * Deze knop toont alleen geselecteerde rijen
 */

// Na pagina laden script uitvoeren
window.addEventListener('DOMContentLoaded', function() {
  setupToonSelectieButton();
});

/**
 * Maakt een knop in het filter panel die tussen gevilterde en 
 * ongefilterder weergave wisselt
 */
function setupToonSelectieButton() {
  // Zoek het filter panel
  const filterPanel = document.querySelector('.flex.flex-wrap.gap-1.items-center.mb-0\\.5.bg-gray-50.p-0\\.5');
  
  if (!filterPanel) {
    console.error('Filter panel niet gevonden!');
    return;
  }
  
  // Maak de knop
  const button = document.createElement('a');
  button.id = 'filter-selection-button';
  button.href = '#';
  button.className = 'selection-toggle-button';
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg><span>Toon selectie</span>';
  
  // Plaats de knop als eerste kind in het filter panel (vóór alle andere knoppen)
  filterPanel.insertBefore(button, filterPanel.firstChild);
  
  // Voeg click handler toe
  let filterActief = false;
  
  button.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Verzamel alle rijen
    const alleRijen = document.querySelectorAll('tr.order-row');
    
    // Verzamel alle aangevinkte checkboxes
    const aangevinktCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    
    // Geen selecties? Doe niets
    if (aangevinktCheckboxes.length === 0) {
      return;
    }
    
    // Verzamel geselecteerde rijen
    const geselecteerdeRijen = [];
    aangevinktCheckboxes.forEach(checkbox => {
      const rij = checkbox.closest('tr');
      if (rij) {
        geselecteerdeRijen.push(rij);
      }
    });
    
    console.log(`${geselecteerdeRijen.length} rijen geselecteerd`);
    
    // Toggle tussen gefilterde en ongefilterde weergave
    if (filterActief) {
      // Toon alle rijen
      alleRijen.forEach(rij => {
        rij.style.display = '';
      });
      
      // Werk knop bij
      button.classList.remove('active');
      button.querySelector('span').textContent = 'Toon selectie';
      
      filterActief = false;
    } else {
      // Verberg alle rijen
      alleRijen.forEach(rij => {
        rij.style.display = 'none';
      });
      
      // Toon alleen geselecteerde rijen
      geselecteerdeRijen.forEach(rij => {
        rij.style.display = '';
      });
      
      // Werk knop bij
      button.classList.add('active');
      button.querySelector('span').textContent = 'Toon alle items';
      
      filterActief = true;
    }
  });
}

// Functie publiek beschikbaar maken
window.setupToonSelectieButton = setupToonSelectieButton;