/**
 * Backup API voor Stonewhistle workshop management system
 * 
 * Deze module biedt API-functies voor het beheren van database backups via de webinterface
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zorg ervoor dat de backup directory bestaat
const backupDir = path.resolve(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Haalt de lijst van beschikbare backups op
 * @returns {Promise<Array<{name: string, path: string, size: number, date: Date}>>}
 */
export async function getBackupsList() {
  try {
    // Lees alle bestanden in de backup directory
    const files = fs.readdirSync(backupDir);
    
    // Filter SQL bestanden en verzamel metadata
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          date: stats.mtime
        };
      })
      // Sorteer op datum, nieuwste eerst
      .sort((a, b) => b.date - a.date);
    
    return backups;
  } catch (error) {
    console.error('Fout bij ophalen backup lijst:', error);
    throw new Error(`Kon backup lijst niet ophalen: ${error.message}`);
  }
}

/**
 * Maakt een nieuwe backup van de database
 * @returns {Promise<{success: boolean, filename?: string, error?: string}>}
 */
export async function createBackup() {
  try {
    // Verkrijg database info uit environment variabelen
    const { PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT } = process.env;
    
    // Controleer of alle benodigde variabelen aanwezig zijn
    if (!PGDATABASE || !PGUSER || !PGPASSWORD || !PGHOST) {
      throw new Error('Benodigde database environment variabelen ontbreken');
    }

    // Maak een bestandsnaam met timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Duidelijke bestandsnaam voor backup
    const backupFileName = `backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    console.log(`Backup starten naar: ${backupFilePath}`);

    // Voer pg_dump uit met database inloggegevens
    const pgDumpCommand = `PGPASSWORD="${PGPASSWORD}" pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -F p -b -v -f "${backupFilePath}" ${PGDATABASE}`;
    
    const { stdout, stderr } = await execPromise(pgDumpCommand);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(`Database backup fout: ${stderr}`);
    }

    console.log(`Database backup voltooid: ${backupFileName}`);
    console.log(`Bestandsgrootte: ${formatFileSize(fs.statSync(backupFilePath).size)}`);
    
    // Sla de datum van de laatste backup op in een tekstbestand
    fs.writeFileSync(
      path.join(__dirname, '..', 'laatste-backup.txt'), 
      `Laatste backup gemaakt op: ${new Date().toLocaleString()}\nBestandsnaam: ${backupFileName}`
    );
    
    return {
      success: true,
      filename: backupFileName,
      path: backupFilePath,
      size: fs.statSync(backupFilePath).size,
      sizeFormatted: formatFileSize(fs.statSync(backupFilePath).size)
    };
  } catch (error) {
    console.error('Database backup fout:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Zet een backup terug naar de database
 * @param {string} backupFileName - Naam van het backup bestand in de backups map
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function restoreBackup(backupFileName) {
  try {
    const backupFilePath = path.join(backupDir, backupFileName);

    // Controleer of het bestand bestaat
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup bestand niet gevonden: ${backupFileName}`);
    }

    // Verkrijg database credentials uit omgevingsvariabelen
    const { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;

    // Controleer of er database credentials zijn
    if (!PGUSER || !PGPASSWORD || !PGDATABASE || !PGHOST || !PGPORT) {
      throw new Error('Database credentials niet gevonden in omgevingsvariabelen');
    }

    console.log(`Starten met terugzetten van database backup: ${backupFilePath}`);
    
    // Voer psql uit om de backup terug te zetten
    const restoreCommand = `PGPASSWORD="${PGPASSWORD}" psql -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -f "${backupFilePath}"`;
    
    const { stdout, stderr } = await execPromise(restoreCommand);
    
    // Niet alle psql output op stderr is een fout, dus we controleren specifiek op ERROR:
    if (stderr && stderr.toLowerCase().includes('error:')) {
      throw new Error(`Fout bij herstellen database: ${stderr}`);
    }
    
    // Sla de datum van de laatste restore op in een tekstbestand
    fs.writeFileSync(
      path.join(__dirname, '..', 'laatste-restore.txt'), 
      `Laatste restore uitgevoerd op: ${new Date().toLocaleString()}\nVanuit bestand: ${backupFileName}`
    );
    
    console.log(`Database hersteld vanuit backup: ${backupFileName}`);
    
    return { 
      success: true,
      message: `Database succesvol hersteld vanuit ${backupFileName}`
    };
  } catch (error) {
    console.error('Fout bij herstellen van database:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verwijdert een backup bestand
 * @param {string} backupFileName - Naam van het backup bestand in de backups map
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteBackup(backupFileName) {
  try {
    const backupFilePath = path.join(backupDir, backupFileName);

    // Controleer of het bestand bestaat
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup bestand niet gevonden: ${backupFileName}`);
    }

    // Verwijder het bestand
    fs.unlinkSync(backupFilePath);
    
    console.log(`Backup verwijderd: ${backupFileName}`);
    
    return { 
      success: true,
      message: `Backup ${backupFileName} is verwijderd`
    };
  } catch (error) {
    console.error('Fout bij verwijderen backup:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Formatteert een bestandsgrootte in bytes naar een leesbaar formaat
 * @param {number} bytes - Bestandsgrootte in bytes
 * @returns {string} Geformatteerde bestandsgrootte
 */
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}