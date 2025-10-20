/**
 * Script om serienummer inconsistenties te identificeren en te corrigeren
 * 
 * Dit script controleert of er items zijn met dezelfde serienummers maar verschillende specificaties,
 * en kan gebruikt worden om inconsistenties automatisch te detecteren en te corrigeren.
 */

import pg from 'pg';
const { Pool } = pg;
// Tijdelijke oplossing: handmatig een subset van SERIAL_NUMBER_DATABASE maken
// Dit is omdat ESM niet rechtstreeks TypeScript bestanden kan importeren

// Voorbeeld van enkele bekende serienummers uit de database
const SERIAL_NUMBER_DATABASE = {
  'SW-1542-2': {type: 'INNATO', tuning: 'A3', frequency: '432', color: ''},
  'SW-1542-3': {type: 'INNATO', tuning: 'B3', frequency: '432', color: ''},
  'SW-1542-4': {type: 'INNATO', tuning: 'C4', frequency: '432', color: ''},
  'SW-1542-5': {type: 'INNATO', tuning: 'D4', frequency: '432', color: ''}
};

// Database connectie
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDuplicateSerialNumbers() {
  console.log('Serienummer inconsistenties controleren...');
  
  try {
    // Ophalen van alle orderitems gegroepeerd op serienummer
    const result = await pool.query(`
      SELECT 
        serial_number, 
        COUNT(*) as count,
        array_agg(id) as item_ids,
        array_agg(specifications::text) as specs_array
      FROM 
        order_items
      WHERE 
        serial_number IS NOT NULL
        AND is_archived = false
      GROUP BY 
        serial_number
      HAVING 
        COUNT(*) > 1
    `);
    
    if (result.rows.length === 0) {
      console.log('Geen dubbele serienummers gevonden.');
      return [];
    }
    
    console.log(`${result.rows.length} serienummers met meerdere items gevonden.`);
    
    const inconsistencies = [];
    
    // Voor elk duplicaat serienummer, controleer of de specificaties verschillen
    for (const row of result.rows) {
      const { serial_number, count, item_ids, specs_array } = row;
      
      // Converteer strings naar objecten
      const specifications = specs_array.map(spec => {
        try {
          return JSON.parse(spec);
        } catch (e) {
          return {};
        }
      });
      
      // Controleer of er verschil is in fluteType of tuning
      let hasInconsistency = false;
      let baseFlute = null;
      let baseTuning = null;
      
      for (let i = 0; i < specifications.length; i++) {
        const spec = specifications[i];
        const fluteType = spec.fluteType || spec.model || spec.type;
        const tuning = spec.tuning;
        
        if (i === 0) {
          baseFlute = fluteType;
          baseTuning = tuning;
        } else if (fluteType !== baseFlute || tuning !== baseTuning) {
          hasInconsistency = true;
          break;
        }
      }
      
      // Als het serienummer in SERIAL_NUMBER_DATABASE staat, controleer dan of specs kloppen
      let inDatabase = false;
      if (serial_number in SERIAL_NUMBER_DATABASE) {
        inDatabase = true;
        const dbSpec = SERIAL_NUMBER_DATABASE[serial_number];
        
        // Controleer of de database specs verschillen van de item specs
        for (let i = 0; i < specifications.length; i++) {
          const spec = specifications[i];
          const fluteType = spec.fluteType || spec.model || spec.type;
          const tuning = spec.tuning;
          
          if (fluteType !== dbSpec.type || tuning !== dbSpec.tuning) {
            hasInconsistency = true;
            break;
          }
        }
      }
      
      if (hasInconsistency) {
        inconsistencies.push({
          serialNumber: serial_number,
          count,
          itemIds: item_ids,
          specs: specifications,
          inDatabase,
          databaseSpec: inDatabase ? SERIAL_NUMBER_DATABASE[serial_number] : null
        });
      }
    }
    
    if (inconsistencies.length === 0) {
      console.log('Geen specificatie inconsistenties gevonden bij dubbele serienummers.');
    } else {
      console.log(`${inconsistencies.length} serienummers met inconsistente specificaties gevonden:`);
      
      for (const item of inconsistencies) {
        console.log(`\nSerienummer: ${item.serialNumber} (${item.count} items)`);
        console.log(`In database: ${item.inDatabase ? 'JA' : 'NEE'}`);
        
        if (item.inDatabase) {
          console.log(`Database spec: ${item.databaseSpec.type} ${item.databaseSpec.tuning}`);
        }
        
        console.log('Items:');
        for (let i = 0; i < item.itemIds.length; i++) {
          const spec = item.specs[i];
          const fluteType = spec.fluteType || spec.model || spec.type || 'UNKNOWN';
          const tuning = spec.tuning || 'UNKNOWN';
          console.log(`  - ID ${item.itemIds[i]}: ${fluteType} ${tuning}`);
        }
      }
    }
    
    return inconsistencies;
    
  } catch (error) {
    console.error('Fout bij controleren van serienummers:', error);
    return [];
  }
}

// Functie om inconsistenties te corrigeren
async function fixInconsistencies(inconsistencies) {
  console.log('\nSerienummer inconsistenties corrigeren...');
  
  if (inconsistencies.length === 0) {
    console.log('Geen inconsistenties om te corrigeren.');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const item of inconsistencies) {
      console.log(`\nBezig met corrigeren van serienummer: ${item.serialNumber}`);
      
      // Als het serienummer in de database staat, gebruik die specs als standaard
      if (item.inDatabase) {
        console.log(`  Serienummer staat in database, gebruik database specs: ${item.databaseSpec.type} ${item.databaseSpec.tuning}`);
        
        // Update alle items zodat ze overeenkomen met de database-specificaties
        for (let i = 0; i < item.itemIds.length; i++) {
          const id = item.itemIds[i];
          const spec = item.specs[i];
          
          // Maak kopie van de bestaande specificaties
          const updatedSpec = { ...spec };
          
          // Update specifieke velden naar de waarden uit de database
          updatedSpec.fluteType = item.databaseSpec.type;
          updatedSpec.type = item.databaseSpec.type;
          updatedSpec.model = item.databaseSpec.type;
          updatedSpec.tuning = item.databaseSpec.tuning;
          
          if (item.databaseSpec.frequency) {
            updatedSpec.frequency = item.databaseSpec.frequency;
          }
          
          if (item.databaseSpec.color) {
            updatedSpec.color = item.databaseSpec.color;
          }
          
          await client.query(
            'UPDATE order_items SET specifications = $1, item_type = $2 WHERE id = $3',
            [updatedSpec, `${item.databaseSpec.type} ${item.databaseSpec.tuning}`, id]
          );
          
          console.log(`  - Item ${id} bijgewerkt om overeen te komen met database specificaties`);
        }
      } else {
        // Serienummer staat niet in database, kies eerste item als "correct"
        const primaryId = item.itemIds[0];
        const primarySpec = item.specs[0];
        const fluteType = primarySpec.fluteType || primarySpec.model || primarySpec.type || 'UNKNOWN';
        const tuning = primarySpec.tuning || 'UNKNOWN';
        
        console.log(`  Serienummer niet in database, gebruik eerste item als standaard: ${fluteType} ${tuning}`);
        
        // Voeg toe aan runtime database in deze sessie
        console.log(`  Advies: Voeg toe aan SERIAL_NUMBER_DATABASE:
        '${item.serialNumber}': {type: '${fluteType}', tuning: '${tuning}', frequency: '${primarySpec.frequency || "432"}', color: '${primarySpec.color || ""}'}`);
        
        // Update alle andere items
        for (let i = 1; i < item.itemIds.length; i++) {
          const id = item.itemIds[i];
          
          // Maak een nieuw serienummer voor dit item
          const baseParts = item.serialNumber.split('-');
          const baseOrderNumber = baseParts[0] + '-' + baseParts[1];
          const newIndex = parseInt(baseParts[2]) + 100 + i; // 100+ om botsingen te voorkomen
          const newSerialNumber = `${baseOrderNumber}-${newIndex}`;
          
          await client.query(
            'UPDATE order_items SET serial_number = $1 WHERE id = $2',
            [newSerialNumber, id]
          );
          
          console.log(`  - Item ${id} serienummer gewijzigd naar ${newSerialNumber}`);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('\nAlle inconsistenties zijn gecorrigeerd!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fout bij corrigeren van inconsistenties:', error);
  } finally {
    client.release();
  }
}

// Hoofd uitvoeringsblok
async function main() {
  try {
    const inconsistencies = await checkDuplicateSerialNumbers();
    
    if (inconsistencies.length > 0) {
      // Bevestiging vragen voor corrigeren
      import('readline').then(async ({ default: readline }) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('\nWilt u deze inconsistenties automatisch corrigeren? (j/n) ', async (answer) => {
          if (answer.toLowerCase() === 'j') {
            await fixInconsistencies(inconsistencies);
          } else {
            console.log('Geen correcties uitgevoerd.');
          }
          
          rl.close();
          await pool.end();
          process.exit(0);
        });
      });
    } else {
      await pool.end();
      process.exit(0);
    }
  } catch (error) {
    console.error('Onverwachte fout:', error);
    await pool.end();
    process.exit(1);
  }
}

main();