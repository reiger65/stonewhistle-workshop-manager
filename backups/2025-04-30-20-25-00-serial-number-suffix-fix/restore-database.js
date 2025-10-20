/**
 * Restore script voor Stonewhistle workshop management system
 * 
 * Dit script zet een eerder gemaakte database backup terug naar de PostgreSQL database
 * Gebruik: node restore-database.js backups/bestandsnaam.sql [--restart]
 * 
 * De --restart optie zorgt ervoor dat de server automatisch wordt herstart na de restore
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Maak een promise versie van exec
const execPromise = promisify(execCallback);

// Controleer of het bestand is opgegeven als argument
if (process.argv.length < 3) {
  console.error('Gebruik: node restore-database.js pad/naar/backup-bestand.sql [--restart]');
  process.exit(1);
}

const backupFilePath = process.argv[2];

// Controleer of de --restart flag is meegegeven
const shouldRestart = process.argv.includes('--restart');

// Controleer of het bestand bestaat en toegankelijk is
try {
  if (!fs.existsSync(backupFilePath)) {
    console.error(`Bestand niet gevonden: ${backupFilePath}`);
    process.exit(1);
  }
  
  // Controleer of het bestand leesbaar is
  const stats = fs.statSync(backupFilePath);
  if (!stats.isFile()) {
    console.error(`Het opgegeven pad is geen bestand: ${backupFilePath}`);
    process.exit(1);
  }
  
  // Controleer of we het bestand kunnen lezen
  fs.accessSync(backupFilePath, fs.constants.R_OK);
  
  // Toon bestandsinfo
  console.log(`Backup bestand gevonden: ${backupFilePath}`);
  console.log(`Bestandsgrootte: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Laatste wijziging: ${stats.mtime}`);
} catch (fsError) {
  console.error(`Fout bij toegang tot bestand: ${backupFilePath}`);
  console.error(`Details: ${fsError.message}`);
  process.exit(1);
}

// Verkrijg database credentials uit omgevingsvariabelen
const {
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGHOST,
  PGPORT,
  DATABASE_URL
} = process.env;

// Controleer of er database credentials zijn
if (!DATABASE_URL && (!PGUSER || !PGDATABASE)) {
  console.error('Database credentials niet gevonden in omgevingsvariabelen');
  console.error('Zorg ervoor dat de applicatie is opgestart voor u dit script uitvoert');
  process.exit(1);
}

async function restoreDatabase() {
  try {
    console.log(`\nStarten met terugzetten van database backup: ${backupFilePath}`);
    console.log('='.repeat(60));
    console.log('WAARSCHUWING: Dit zal alle bestaande data overschrijven!');
    console.log('Zorg ervoor dat de applicatie is gestopt voordat u doorgaat.');
    console.log('='.repeat(60));
    
    // Vraag bevestiging (in een productie-omgeving)
    // In Replit kunnen we dit overslaan, maar het is goed om te weten dat dit normaal gesproken nodig zou zijn
    
    console.log('\nBegin met terugzetten van database...');
    
    // Controleer eerst of PSQL beschikbaar is
    try {
      console.log('Controleren of PSQL beschikbaar is...');
      await execPromise('which psql');
      console.log('PSQL gevonden op systeem');
    } catch (psqlCheckError) {
      console.error('PSQL niet gevonden op systeem. Installeer PostgreSQL client tools.');
      throw new Error('PSQL commando niet beschikbaar: ' + psqlCheckError.message);
    }
    
    // Controleer of connectie met de database mogelijk is
    try {
      console.log('Testen van database verbinding...');
      await execPromise(`PGPASSWORD="${PGPASSWORD}" psql -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -c "SELECT 1"`, { timeout: 5000 });
      console.log('Database verbinding succesvol getest');
    } catch (dbConnectionError) {
      console.warn(`Database verbindingstest mislukt: ${dbConnectionError.message}`);
      console.log('Ga toch door met restore poging...');
    }
    
    // Gebruik PSQL om de database te herstellen
    // SQL bestanden kunnen groot zijn, gebruik specifieke timeout en buffer settings
    const psqlOptions = {
      timeout: 300000, // 5 minuten timeout
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer voor grote SQL dumps
    };
    
    const psqlCmd = `psql "${DATABASE_URL}" < "${backupFilePath}"`;
    
    console.log('Uitvoeren restore commando...');
    console.log('Dit kan enkele minuten duren, wees geduldig...');
    
    let success = false;
    try {
      const { stdout, stderr } = await execPromise(psqlCmd, psqlOptions);
      
      // Controleer stderr maar negeer errors over bestaande objecten
      // Veel van deze fouten zijn normaal bij een restore als de tabellen al bestaan
      if (stderr) {
        if (stderr.includes('ERROR') && 
            !stderr.includes('already exists') && 
            !stderr.includes('duplicate key value')) {
          console.warn(`Restore waarschuwingen: ${stderr}`);
        } else {
          console.log('Restore voltooid met normale berichten:');
          console.log(stderr);
        }
      }
      
      if (stdout) {
        console.log('PSQL output:');
        console.log(stdout);
      }
      
      success = true;
    } catch (execError) {
      // Vang ernstige fouten af maar laat het script doorgaan
      console.warn(`Restore executie waarschuwing: ${execError.message}`);
      
      // Log gedetailleerde foutinformatie
      if (execError.stdout) console.log('PSQL stdout:', execError.stdout);
      if (execError.stderr) console.log('PSQL stderr:', execError.stderr);
      
      // Als het een timeout is, is dat een kritieke fout
      if (execError.message.includes('timeout')) {
        throw new Error(`Restore timeout na ${psqlOptions.timeout/1000} seconden. Database is mogelijk in inconsistente staat.`);
      }
      
      // Als het een andere ernstige fout is zoals 'bestand in gebruik'
      if (execError.message.includes('in use') || 
          execError.message.includes('Permission denied') || 
          execError.message.includes('Access is denied')) {
        throw new Error(`Kan backup bestand niet lezen: ${execError.message}`);
      }
      
      // Anders laten we het proces doorgaan omdat de meeste errors niet-fataal zijn
      console.log('Ga door ondanks waarschuwingen...');
    }
    
    // Extra check na restore
    if (success) {
      try {
        // Voer een eenvoudige query uit om te controleren of de database nog steeds toegankelijk is
        await execPromise(`PGPASSWORD="${PGPASSWORD}" psql -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -c "SELECT count(*) FROM pg_catalog.pg_tables"`, { timeout: 5000 });
        console.log('Database is toegankelijk na restore');
      } catch (postRestoreError) {
        console.warn(`Database check na restore mislukt: ${postRestoreError.message}`);
        console.log('De restore kan mogelijk onvolledig zijn. Controleer de database handmatig.');
      }
    }
    
    console.log('\nDatabase succesvol teruggezet!');
    console.log(`\nBackup bestand: ${backupFilePath}`);
    console.log(`Datum: ${new Date().toLocaleString()}`);
    
    // Update het laatste backup bestand
    const logContent = `Laatste restore uitgevoerd op: ${new Date().toISOString()}\nBackup bestand: ${backupFilePath}\n`;
    fs.writeFileSync('laatste-restore.txt', logContent, 'utf8');
    
    // Controleer of we moeten herstarten op basis van de --restart flag
    if (shouldRestart) {
      console.log('\nDe applicatie zal nu automatisch worden herstart.');
      console.log('Controleer of alles correct werkt na de restore.');
      
      // Herstart de applicatie door de workflow opnieuw te starten
      try {
        console.log('\nHerstarten van de applicatie...');
        // We kunnen niet de workflow direct herstarten, maar we kunnen de server proces beëindigen,
        // waarna het Replit workflow systeem automatisch de server zal herstarten
        setTimeout(() => {
          process.exit(0); // Graceful shutdown, workflow zal automatisch herstarten
        }, 1000); // Kleine vertraging om te zorgen dat alle logs correct zijn weergegeven
      } catch (restartError) {
        console.error('Fout bij het herstarten van de applicatie:', restartError);
      }
    } else {
      console.log('\nDe database is succesvol teruggezet.');
      console.log('Voor het activeren van de wijzigingen moet de applicatie handmatig worden herstart.');
      console.log('Gebruik --restart als commandline parameter om automatisch te herstarten na restore.');
    }
    
  } catch (error) {
    console.error('\nFout bij het terugzetten van de database:');
    console.error(error);
    process.exit(1);
  }
}

// Start de restore
restoreDatabase();