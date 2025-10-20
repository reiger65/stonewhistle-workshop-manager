/**
 * Eenvoudig backup script voor Stonewhistle workshop management system
 * 
 * Dit script maakt een VEILIGE SQL dump van de database zonder de bestaande gegevens te wijzigen
 */

import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execPromise = promisify(execCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zorg ervoor dat de backup directory bestaat
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupDatabase() {
  try {
    // Verkrijg database info uit environment variabelen
    const { PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT } = process.env;
    
    // Controleer of alle benodigde variabelen aanwezig zijn
    if (!PGDATABASE || !PGUSER || !PGPASSWORD || !PGHOST) {
      throw new Error('Benodigde database environment variabelen ontbreken');
    }

    // Controleer of backup directory schrijfbaar is
    try {
      const testFile = path.join(backupDir, '.write_test_' + Date.now());
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('Backup directory is schrijfbaar, backup kan starten');
    } catch (fsError) {
      throw new Error(`Backup directory is niet schrijfbaar: ${fsError.message}. Controleer bestandsrechten.`);
    }

    // Maak een bestandsnaam met timestamp
    const now = new Date();
    
    // Gebruik een betrouwbare datumformattering
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}-${month}-${year}`;
    const timeComponent = `${hours}-${minutes}`;
    
    // Duidelijke bestandsnaam voor backup
    const backupFileName = `stonewhistle-backup-${formattedDate}-${timeComponent}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    console.log(`Backup starten naar: ${backupFilePath}`);
    console.log(`Actuele datum en tijd: ${now.toString()}`);

    // Voer pg_dump uit met database inloggegevens als environment variabelen
    const pgDumpCommand = `PGPASSWORD="${PGPASSWORD}" pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -F p -b -v -f "${backupFilePath}" ${PGDATABASE}`;
    
    const { stdout, stderr } = await execPromise(pgDumpCommand);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(`Database backup fout: ${stderr}`);
    }

    console.log(`Database backup voltooid: ${backupFileName}`);
    console.log(`Bestandsgrootte: ${(fs.statSync(backupFilePath).size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Sla de datum van de laatste backup op in een tekstbestand
    fs.writeFileSync(
      path.join(__dirname, 'laatste-backup.txt'), 
      `Laatste backup gemaakt op: ${new Date().toLocaleString('nl-NL')}\nBestandsnaam: ${backupFileName}`
    );
    
    return {
      success: true,
      backupFile: backupFileName,
      backupPath: backupFilePath
    };
  } catch (error) {
    console.error('Database backup fout:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Direct uitvoeren wanneer script wordt gestart
backupDatabase()
  .then(result => {
    if (result.success) {
      console.log('Backup proces succesvol afgerond');
    } else {
      console.error('Backup proces mislukt');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Onverwachte fout in backup proces:', err);
    process.exit(1);
  });