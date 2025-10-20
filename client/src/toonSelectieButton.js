// Pure JavaScript oplossing voor de Toon Selectie knop
const toonSelectieScript = () => {
  // Wacht tot de DOM volledig is geladen
  document.addEventListener("DOMContentLoaded", function() {
    // Zoek de knop via ID
    const setupToonSelectieButton = function() {
      const button = document.getElementById("toonSelectieKnop");
      if (!button) {
        console.log("Toon selectie knop niet gevonden, opnieuw proberen over 1 seconde");
        setTimeout(setupToonSelectieButton, 1000);
        return;
      }
      
      console.log("Toon Selectie knop gevonden en JavaScript wordt geïnitialiseerd");
      
      // Houdt bij of we in selectiemodus zijn
      let selectieModusActief = false;
      
      // Originele opdracht
      button.onclick = function() {
        console.log("Toon Selectie knop geklikt");
        
        // Verzamel alle rijen
        const alleRijen = document.querySelectorAll('tr.order-row');
        console.log(`Aantal gevonden rijen: ${alleRijen.length}`);
        
        // Verzamel alle checkboxes die aangevinkt zijn
        const aangevinkteCellen = document.querySelectorAll('input[type="checkbox"]:checked');
        console.log(`Aantal aangevinkte checkboxes: ${aangevinkteCellen.length}`);
        
        if (aangevinkteCellen.length === 0) {
          console.log("Geen items geselecteerd");
          return;
        }
        
        // Verzamel alle geselecteerde rijen
        const geselecteerdeRijen = [];
        aangevinkteCellen.forEach(checkbox => {
          // Vind de parent rij (tr)
          let rij = checkbox.closest('tr');
          if (rij) {
            geselecteerdeRijen.push(rij);
          }
        });
        
        console.log(`Aantal gevonden geselecteerde rijen: ${geselecteerdeRijen.length}`);
        
        // Toggle tussen alle rijen tonen en alleen geselecteerde rijen
        if (selectieModusActief) {
          // Toon alle rijen weer
          alleRijen.forEach(rij => {
            rij.style.display = '';
          });
          
          // Update knop stijl en tekst
          button.classList.remove("bg-blue-500", "text-white");
          button.classList.add("bg-blue-100", "text-blue-800");
          const buttonText = button.querySelector('span:last-child');
          if (buttonText) buttonText.textContent = 'Toon selectie';
          
          // Update de status
          selectieModusActief = false;
        } else {
          // Verberg alle rijen
          alleRijen.forEach(rij => {
            rij.style.display = 'none';
          });
          
          // Toon alleen geselecteerde rijen
          geselecteerdeRijen.forEach(rij => {
            rij.style.display = '';
          });
          
          // Update knop stijl en tekst
          button.classList.remove("bg-blue-100", "text-blue-800");
          button.classList.add("bg-blue-500", "text-white");
          const buttonText = button.querySelector('span:last-child');
          if (buttonText) buttonText.textContent = 'Toon alle items';
          
          // Update de status
          selectieModusActief = true;
        }
      };
    };
    
    // Eerste poging om de knop te vinden
    setupToonSelectieButton();
  });
};

export default toonSelectieScript;