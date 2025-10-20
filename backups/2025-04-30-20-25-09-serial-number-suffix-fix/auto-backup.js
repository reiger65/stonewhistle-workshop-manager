/**
 * Automatisch backup script voor Stonewhistle workshop management system
 * 
 * Dit script gebruikt node-cron om periodiek een database backup te maken
 * en deze naar Google Drive te uploaden
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { backupDatabase } from './backup-database.js';
import { backupToDrive } from './backup-to-drive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configureer de cron schedule (standaard: elke dag om 3:00 AM)
// Format: [seconde] [minuut] [uur] [dag vd maand] [maand] [dag vd week]
// Zie: https://github.com/node-cron/node-cron#cron-syntax
const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 0 3 * * *';

// Sla datum van laatste backup op
const LAST_BACKUP_FILE = path.join(__dirname, 'laatste-backup.txt');

// Houd logs bij van backup pogingen
function logBackupAttempt(success, details) {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'FAILED';
  const logMessage = `[${timestamp}] [${status}] ${details}\n`;
  
  // Schrijf naar console
  console.log(logMessage);
  
  // Update het laatste backup bestand als succesvol
  if (success) {
    fs.writeFileSync(LAST_BACKUP_FILE, `${timestamp}\n${details}`);
  }
}

// Voer database backup uit
async function performBackup() {
  try {
    console.log(`\n===== AUTOMATISCHE DATABASE BACKUP BEGONNEN: ${new Date().toISOString()} =====`);
    
    // Eerst lokale backup
    const backupResult = await backupDatabase();
    
    if (!backupResult.success) {
      logBackupAttempt(false, `Lokale database backup mislukt: ${backupResult.error}`);
      return;
    }
    
    logBackupAttempt(true, `Lokale database backup voltooid: ${backupResult.backupFile}`);
    
    // Dan uploaden naar Google Drive (als credentials aanwezig zijn)
    try {
      const driveBackupResult = await backupToDrive();
      
      if (driveBackupResult.success) {
        logBackupAttempt(true, `Google Drive backup voltooid: ${driveBackupResult.webLink}`);
      } else {
        logBackupAttempt(false, `Google Drive backup mislukt: ${driveBackupResult.error}`);
      }
    } catch (driveError) {
      logBackupAttempt(false, `Google Drive backup fout: ${driveError.message}`);
    }
    
    console.log(`===== AUTOMATISCHE DATABASE BACKUP VOLTOOID: ${new Date().toISOString()} =====\n`);
  } catch (error) {
    console.error('Onverwachte fout tijdens backup proces:', error);
    logBackupAttempt(false, `Onverwachte fout: ${error.message}`);
  }
}

// Controleer wanneer de laatste backup was uitgevoerd
function getLastBackupInfo() {
  try {
    if (fs.existsSync(LAST_BACKUP_FILE)) {
      const content = fs.readFileSync(LAST_BACKUP_FILE, 'utf8');
      const [timestamp] = content.split('\n');
      return { 
        timestamp,
        date: new Date(timestamp)
      };
    }
  } catch (error) {
    console.error('Fout bij lezen laatste backup info:', error);
  }
  
  return { timestamp: 'Nooit', date: null };
}

// Start de cron job voor geautomatiseerde backups
function startAutomaticBackups() {
  const lastBackup = getLastBackupInfo();
  
  console.log('\n===== AUTOMATISCH BACKUP SYSTEEM =====');
  console.log(`Backup planning: ${BACKUP_SCHEDULE}`);
  console.log(`Laatste backup: ${lastBackup.timestamp}`);
  
  // Plan de backup job met cron
  const job = cron.schedule(BACKUP_SCHEDULE, () => {
    console.log(`Geplande backup start: ${new Date().toISOString()}`);
    performBackup();
  });
  
  console.log('Automatisch backup systeem gestart.');
  console.log('=========================================\n');
  
  return job;
}

// Controleer of het script direct wordt uitgevoerd
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  // Start de terugkerende cron job
  const job = startAutomaticBackups();
  
  // Optioneel: Voer direct een backup uit voor testen
  if (process.argv.includes('--now')) {
    console.log('Directe backup uitvoeren...');
    performBackup();
  }
  
  // Zorg ervoor dat het script blijft draaien voor de cron job
  process.on('SIGINT', () => {
    console.log('Automatisch backup systeem wordt gestopt...');
    job.stop();
    process.exit();
  });
}

// Exporteer de functies voor gebruik in andere scripts
export { startAutomaticBackups, performBackup };