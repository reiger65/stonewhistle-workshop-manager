import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execPromise = promisify(exec);
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Lees logfunctie om debug informatie te loggen
const logBackupInfo = (message) => {
  console.log(`[Backup] ${new Date().toISOString()} - ${message}`);
};

// Trigger een database backup
router.post('/database', async (req, res) => {
  try {
    console.log('Database backup gestart via API...');
    
    // Voer het backup script uit
    const scriptPath = path.join(rootDir, 'backup-database.js');
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(`Database backup mislukt: ${stderr}`);
    }
    
    // Haal de bestandsnaam uit de output
    const filenameMatch = stdout.match(/Database backup voltooid: (stonewhistle-db-backup-.*\.sql)/);
    const backupFileName = filenameMatch ? filenameMatch[1] : null;
    
    // Stuur het resultaat terug
    return res.status(200).json({
      success: true,
      message: 'Database backup succesvol voltooid',
      filename: backupFileName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fout tijdens backup via API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden tijdens het backup proces'
    });
  }
});

// Verkrijg een lijst van beschikbare backups
router.get('/list', async (req, res) => {
  try {
    const backupDir = path.join(rootDir, 'backups');
    
    // Controleer of de backup map bestaat
    if (!fs.existsSync(backupDir)) {
      logBackupInfo(`Backup directory bestaat niet: ${backupDir}`);
      return res.status(200).json({
        success: true,
        backups: []
      });
    }
    
    // Verkrijg alle SQL bestanden in de backup map met betere foutafhandeling
    let files = [];
    let allFiles = [];
    
    try {
      // Lijst alle bestanden met error handling
      allFiles = fs.readdirSync(backupDir);
      logBackupInfo(`${allFiles.length} bestanden gevonden in backup directory`);
    } catch (dirError) {
      console.error(`Fout bij lezen backup directory: ${dirError.message}`);
      return res.status(200).json({
        success: true,
        message: `Kon backup directory niet lezen: ${dirError.message}`,
        backups: []
      });
    }
    
    // Filter SQL bestanden
    const sqlFiles = allFiles.filter(file => file.endsWith('.sql') && file.includes('stonewhistle-db-backup-'));
    logBackupInfo(`${sqlFiles.length} backup bestanden gevonden in directory`);
    
    // Verwerk backup bestanden individueel met goede foutafhandeling
    files = [];
    for (const file of sqlFiles) {
      try {
        const filePath = path.join(backupDir, file);
        
        // Lees bestandseigenschappen met betere foutafhandeling
        let stats;
        try {
          stats = fs.statSync(filePath);
        } catch (statsError) {
          logBackupInfo(`Kan bestandsinfo niet lezen voor ${file}: ${statsError.message}`);
          stats = { size: 0, mtime: new Date() };
        }
        
        // Lees de bestandsgrootte met foutafhandeling
        let fileSize = "Onbekend";
        try {
          if (stats && stats.size) {
            fileSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
          }
        } catch (sizeError) {
          logBackupInfo(`Kan bestandsgrootte niet bepalen voor ${file}: ${sizeError.message}`);
        }
        
        // Extract datum uit bestandsnaam met meerdere fallback opties
        let fileDate = null;
        
        // Optie 1: Extraheer uit bestandsnaam
        try {
          const dateMatch = file.match(/stonewhistle-db-backup-(.+)\.sql/);
          if (dateMatch && dateMatch[1]) {
            // Eenvoudige manier: gebruik alleen het datumgedeelte (voor de T)
            const datePart = dateMatch[1].split('T')[0];
            const timePart = dateMatch[1].split('T')[1];
            
            if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Voeg tijd toe als die bestaat
              const dateString = timePart ? 
                `${datePart}T${timePart.replace(/-/g, ':')}` : 
                datePart;
              
              const parsedDate = new Date(dateString);
              if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2020) {
                fileDate = parsedDate;
                logBackupInfo(`Datum succesvol uit bestandsnaam gehaald: ${file} → ${fileDate.toISOString()}`);
              }
            }
          }
        } catch (dateParseError) {
          logBackupInfo(`Kan datum niet parsen uit bestandsnaam: ${file}, error: ${dateParseError.message}`);
        }
        
        // Optie 2: Gebruik bestandsdatum als fallback
        if (!fileDate && stats && stats.mtime) {
          fileDate = stats.mtime;
          logBackupInfo(`Gebruik bestandswijzigingsdatum voor ${file}: ${fileDate.toISOString()}`);
        }
        
        // Optie 3: Laatste fallback is huidige datum
        if (!fileDate || fileDate.getFullYear() <= 1971) {
          fileDate = new Date();
          logBackupInfo(`Ongeldige datum voor ${file}, gebruik huidige datum: ${fileDate.toISOString()}`);
        }
        
        // Voeg bestandsinfo toe aan resultaat
        files.push({
          filename: file,
          size: fileSize,
          created: fileDate,
          timestamp: fileDate.toISOString()
        });
      } catch (fileProcessError) {
        // Bij fouten laten we het bestand toch zien om restore mogelijk te maken
        logBackupInfo(`Fout bij verwerken van bestand ${file}: ${fileProcessError.message}`);
        files.push({
          filename: file,
          size: "Onbekend",
          created: new Date(),
          timestamp: new Date().toISOString(),
          error: fileProcessError.message
        });
      }
    }
    
    // Sorteer op datum (nieuwste eerst)
    files.sort((a, b) => {
      // Gebruik timestamp voor vergelijking als beschikbaar
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return dateB - dateA;
    });
    
    return res.status(200).json({
      success: true,
      backups: files
    });
  } catch (error) {
    console.error('Fout bij het ophalen van backups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van backups'
    });
  }
});

// API endpoint om een backup terug te zetten
router.post('/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Beveilig tegen directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        error: 'Ongeldige bestandsnaam'
      });
    }
    
    const backupFile = path.join(rootDir, 'backups', filename);
    
    // Controleer of het bestand bestaat
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({
        success: false,
        error: 'Backup bestand niet gevonden'
      });
    }
    
    // Voer het restore script uit
    console.log(`Restore gestart voor bestand: ${filename}`);
    
    // Dit kan een lange operatie zijn, dus we sturen eerst een bevestiging terug
    res.status(200).json({
      success: true,
      message: 'Database restore gestart. De server zal worden herstart na de restore.',
      filename: filename
    });
    
    // Start het restore proces in de achtergrond
    // In een echte productieomgeving zou je dit met een job queue doen
    const restoreScript = path.join(rootDir, 'restore-database.js');
    
    // We geven --restart flag mee om aan te geven dat de applicatie moet herstarten na de restore
    exec(`node ${restoreScript} ${backupFile} --restart`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Restore fout: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Restore stderr: ${stderr}`);
      }
      console.log(`Restore voltooid: ${stdout}`);
      
      // De applicatie wordt nu herstart vanuit het restore-database.js script als de --restart flag is meegegeven
      // We forceren hier dus niet een exit, maar laten het script dit doen
      console.log('Wachten op herstart door het restore script...');
    });
    
  } catch (error) {
    console.error('Fout tijdens restore via API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden tijdens het restore proces'
    });
  }
});

// API endpoint om Google Drive backups op te halen
// Implementatie gebruikt de listDriveBackups functie uit backup-to-drive.js
router.get('/drive/list', async (req, res) => {
  try {
    // Importeer de Google Drive backups functies
    const { listDriveBackups } = await import('../backup-to-drive.js');
    
    // Haal backups op van Google Drive
    const result = await listDriveBackups();
    
    if (!result.success) {
      return res.status(200).json({
        success: true,
        message: `Google Drive backup ophalen mislukt: ${result.error}`,
        backups: []
      });
    }
    
    return res.status(200).json({
      success: true,
      backups: result.backups || []
    });
    
  } catch (error) {
    console.error('Fout bij het ophalen van Google Drive backups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het ophalen van Google Drive backups'
    });
  }
});

// API endpoint om een backup naar Google Drive te uploaden
router.post('/drive/upload', async (req, res) => {
  try {
    // Importeer de Google Drive backup functie
    const { backupToDrive } = await import('../backup-to-drive.js');
    
    // Upload naar Google Drive
    const result = await backupToDrive();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Upload naar Google Drive mislukt'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Backup succesvol geüpload naar Google Drive',
      filename: result.localBackupFile,
      driveId: result.driveFileId,
      webLink: result.webLink
    });
    
  } catch (error) {
    console.error('Fout bij het uploaden naar Google Drive:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden bij het uploaden naar Google Drive'
    });
  }
});

// API endpoint om een Google Drive backup te downloaden en terug te zetten
router.post('/drive/restore/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Importeer de Google Drive download functie
    const { downloadDriveBackup } = await import('../backup-to-drive.js');
    
    // Download het bestand van Google Drive
    const downloadResult = await downloadDriveBackup(fileId);
    
    if (!downloadResult.success) {
      return res.status(500).json({
        success: false,
        error: downloadResult.error || 'Download van Google Drive mislukt'
      });
    }
    
    // Start het restore proces in de achtergrond
    console.log(`Restore gestart voor Drive bestand: ${downloadResult.fileName}`);
    
    // Dit kan een lange operatie zijn, dus we sturen eerst een bevestiging terug
    res.status(200).json({
      success: true,
      message: 'Database restore vanaf Google Drive gestart. De server zal worden herstart na de restore.',
      filename: downloadResult.fileName
    });
    
    // Start het restore proces in de achtergrond
    const restoreScript = path.join(rootDir, 'restore-database.js');
    
    // We geven --restart flag mee om aan te geven dat de applicatie moet herstarten na de restore
    exec(`node ${restoreScript} ${downloadResult.localPath} --restart`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Restore fout: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Restore stderr: ${stderr}`);
      }
      console.log(`Restore voltooid: ${stdout}`);
      
      // De applicatie wordt nu herstart vanuit het restore-database.js script als de --restart flag is meegegeven
      // We forceren hier dus niet een exit, maar laten het script dit doen
      console.log('Wachten op herstart door het restore script...');
    });
    
  } catch (error) {
    console.error('Fout tijdens restore van Google Drive:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Er is een fout opgetreden tijdens het restore proces vanaf Google Drive'
    });
  }
});

export default router;