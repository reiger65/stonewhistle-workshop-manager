/**
 * Initialize mold data for Innato, Natey, Double, and ZEN flutes
 * This script populates the mold_inventory, mold_mappings, and mold_mapping_items tables
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import ws from 'ws';

// Import instrument reference data (we'll extract info from here)
import { 
  getInstrumentReferences, 
  getKeysForInstrumentType 
} from './shared/instrument-reference.js';

// Configure the database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Configure Neon connection for WebSocket support
neonConfig.webSocketConstructor = ws;

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Define common mold types for each instrument
const moldTypes = {
  'INNATO': [
    { name: 'Innato Base', description: 'Base mold for all Innato flutes' },
    { name: 'Innato Left Vessel', description: 'Left vessel for Innato flutes - lowest notes' },
    { name: 'Innato Right Vessel', description: 'Right vessel for Innato flutes - middle notes' },
    { name: 'Innato Front Vessel', description: 'Front vessel for Innato flutes - highest notes' }
  ],
  'NATEY': [
    { name: 'Natey Base', description: 'Base mold for all Natey flutes' },
    { name: 'Natey Vessel', description: 'Single vessel for Natey flutes' }
  ],
  'DOUBLE': [
    { name: 'Double Base', description: 'Base mold for all Double flutes' },
    { name: 'Double Chamber 1', description: 'First chamber for Double flutes' },
    { name: 'Double Chamber 2', description: 'Second chamber for Double flutes' }
  ],
  'ZEN_M': [
    { name: 'ZEN M Base', description: 'Base mold for ZEN M flutes' },
    { name: 'ZEN M Vessel', description: 'Vessel mold for ZEN M flutes' },
  ],
  'ZEN_L': [
    { name: 'ZEN L Base', description: 'Base mold for ZEN L flutes' },
    { name: 'ZEN L Vessel', description: 'Vessel mold for ZEN L flutes' },
  ]
};

async function initializeMolds() {
  try {
    console.log('Starting mold initialization...');
    
    // Get the instrument reference data
    const instruments = getInstrumentReferences();
    
    // For each instrument type, create the base molds
    for (const instrumentType of Object.keys(moldTypes)) {
      console.log(`Creating molds for ${instrumentType}...`);
      
      // Create the base molds for this instrument type
      for (const mold of moldTypes[instrumentType]) {
        await db.execute(
          `INSERT INTO mold_inventory (name, instrument_type, notes, is_active) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (name) DO UPDATE 
           SET instrument_type = $2, notes = $3, is_active = $4
           RETURNING id`,
          [mold.name, instrumentType, mold.description, true]
        );
        
        console.log(`Created/updated mold: ${mold.name}`);
      }
      
      // Find the corresponding instrument in our reference data
      // Need to handle ZEN_M and ZEN_L as special cases
      let instrumentId = instrumentType;
      if (instrumentType === 'ZEN_M' || instrumentType === 'ZEN_L') {
        instrumentId = instrumentType; // Keep as is
      } else {
        instrumentId = instrumentType.split('_')[0]; // Remove any suffixes
      }
      
      const instrument = instruments.find(i => i.id === instrumentId);
      if (!instrument) {
        console.log(`No reference data found for ${instrumentType}, skipping...`);
        continue;
      }
      
      // Get all available keys for this instrument
      const keys = instrument.variants.map(v => v.key);
      
      // For each key, create a mold mapping
      for (const key of keys) {
        const mappingName = `${instrumentType} ${key}`;
        
        // Create the mapping
        const [mappingResult] = await db.execute(
          `INSERT INTO mold_mappings (name, instrument_type, tuning_note, is_active) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (name) DO UPDATE 
           SET instrument_type = $2, tuning_note = $3, is_active = $4
           RETURNING id`,
          [mappingName, instrumentType, key, true]
        );
        
        const mappingId = mappingResult?.id;
        if (!mappingId) {
          console.error(`Failed to create/update mapping for ${mappingName}`);
          continue;
        }
        
        console.log(`Created/updated mapping: ${mappingName} with ID ${mappingId}`);
        
        // Get all molds for this instrument type
        const moldsResult = await db.execute(
          `SELECT id, name FROM mold_inventory WHERE instrument_type = $1`,
          [instrumentType]
        );
        
        // Add each mold to the mapping
        let orderIndex = 0;
        for (const mold of moldsResult) {
          await db.execute(
            `INSERT INTO mold_mapping_items (mapping_id, mold_id, order_index) 
             VALUES ($1, $2, $3)
             ON CONFLICT (mapping_id, mold_id) DO UPDATE 
             SET order_index = $3`,
            [mappingId, mold.id, orderIndex++]
          );
          
          console.log(`Added mold ${mold.name} to mapping ${mappingName}`);
        }
      }
    }
    
    console.log('Mold initialization completed successfully');
    
    // Initialize flute settings based on instrument reference data
    await initializeFluteSettings(instruments);
  } catch (error) {
    console.error('Error initializing molds:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function initializeFluteSettings(instruments) {
  try {
    console.log('Starting flute settings initialization...');
    
    for (const instrument of instruments) {
      console.log(`Creating flute settings for ${instrument.id}...`);
      
      for (const variant of instrument.variants) {
        const { key, notes, noteAdjustments, intervalAdjustments, defaultFrequency } = variant;
        
        // Extract the frequency value
        const frequencyMatch = defaultFrequency.match(/(\d+)\s*Hz/);
        const frequency = frequencyMatch ? parseInt(frequencyMatch[1], 10) : 440;
        
        // Create flute settings entry
        const [result] = await db.execute(
          `INSERT INTO flute_settings 
           (instrument_type, tuning_note, frequency, description, adjusted_notes, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (instrument_type, tuning_note) DO UPDATE
           SET frequency = $3, description = $4, adjusted_notes = $5, is_active = $6
           RETURNING id`,
          [
            instrument.id,
            key,
            frequency,
            `${instrument.name} tuned to ${key} at ${defaultFrequency}`,
            JSON.stringify({
              noteAdjustments: noteAdjustments || [],
              intervalAdjustments: intervalAdjustments || []
            }),
            true
          ]
        );
        
        const settingsId = result?.id;
        if (!settingsId) {
          console.error(`Failed to create/update flute settings for ${instrument.id} ${key}`);
          continue;
        }
        
        console.log(`Created/updated flute settings: ${instrument.id} ${key} with ID ${settingsId}`);
      }
    }
    
    console.log('Flute settings initialization completed successfully');
  } catch (error) {
    console.error('Error initializing flute settings:', error);
    throw error;
  }
}

// Run the initialization
initializeMolds().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});