/**
 * Backup Service Module voor Stonewhistle workshop management system
 * 
 * Deze module beheert automatische backups van de database en integreert met het
 * systeemstatus systeem voor real-time feedback over backup taken.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { updateSystemStatus } from './system-status';

const execPromise = util.promisify(exec);

// Settings
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DEFAULT_MAX_BACKUPS = 10;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Voer een database backup uit
 * @returns Een promise met het resultaat van de backup
 */
export async function performBackup() {
  try {
    // Update status to started
    updateSystemStatus({
      type: 'database_backup',
      status: 'started',
      message: 'Database backup wordt gestart...',
      timestamp: Date.now()
    });

    // Generate timestamp for the backup file
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupFileName = `backup_${timestamp.split('T').join('_')}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Update status to in progress
    updateSystemStatus({
      type: 'database_backup',
      status: 'in_progress',
      message: `Database wordt geback-upt naar ${backupFileName}...`,
      progress: 30,
      timestamp: Date.now()
    });

    // Execute pg_dump to create the backup
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL niet ingesteld');
    }

    const { stdout, stderr } = await execPromise(`pg_dump "${process.env.DATABASE_URL}" -f "${backupPath}"`);
    
    if (stderr && !stderr.includes('NOTICE')) {
      throw new Error(`Database backup error: ${stderr}`);
    }

    // Update status to in progress at 70%
    updateSystemStatus({
      type: 'database_backup',
      status: 'in_progress',
      message: 'Database backup voltooid, oude backups opruimen...',
      progress: 70,
      timestamp: Date.now()
    });

    // Clean up old backups
    await cleanupOldBackups();

    // Update the lastBackup.txt file
    fs.writeFileSync(
      path.join(process.cwd(), 'laatste-backup.txt'),
      `Laatste backup: ${backupFileName} op ${new Date().toISOString()}`
    );

    // Update status to completed
    updateSystemStatus({
      type: 'database_backup',
      status: 'completed',
      message: `Database backup voltooid: ${backupFileName}`,
      progress: 100,
      timestamp: Date.now()
    });

    console.log(`Database backup created successfully: ${backupFileName}`);
    return { success: true, backupFile: backupFileName };
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('Database backup error:', errorMessage);
    
    // Update status to failed
    updateSystemStatus({
      type: 'database_backup',
      status: 'failed',
      message: `Database backup mislukt: ${errorMessage}`,
      timestamp: Date.now()
    });
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Verwijder oude backups om opslagruimte te besparen
 * @param maxBackups Het aantal backups om te behouden (meest recente)
 */
export async function cleanupOldBackups(maxBackups = DEFAULT_MAX_BACKUPS) {
  try {
    // Get list of backup files
    const files = fs.readdirSync(BACKUP_DIR).filter(file => 
      file.endsWith('.sql') && (file.startsWith('backup_') || file.startsWith('stonewhistle-db-backup-'))
    );
    
    // Sort files by modification time (oldest first)
    const sortedFiles = files.map(file => ({
      name: file,
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    })).sort((a, b) => a.time - b.time);
    
    // If we have more backups than maxBackups, delete the oldest ones
    if (sortedFiles.length > maxBackups) {
      const filesToDelete = sortedFiles.slice(0, sortedFiles.length - maxBackups);
      console.log(`Removing ${filesToDelete.length} old backups to keep the ${maxBackups} most recent`);
      
      for (const file of filesToDelete) {
        console.log(`Removing old backup: ${file.name}`);
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      }
      
      console.log(`Cleaned up ${filesToDelete.length} old backups`);
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

/**
 * Schedule een automatische backup na een Shopify synchronisatie
 */
export function scheduleBackupAfterSync() {
  console.log('Automatische backup starten na synchronisatie...');
  performBackup().then(result => {
    if (result.success) {
      console.log(`✅ Automatische backup voltooid: ${result.backupFile}`);
    } else {
      console.error(`❌ Automatische backup mislukt: ${result.error}`);
    }
  });
}