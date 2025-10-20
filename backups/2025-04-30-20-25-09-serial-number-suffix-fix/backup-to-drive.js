/**
 * Google Drive backup script voor Stonewhistle workshop management system
 * 
 * Dit script maakt een backup van de database en upload het naar Google Drive
 * Het vereist een Google Drive API service account en credentials
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { backupDatabase } from './backup-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constanten voor Google Drive configuratie
const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1CRIe5WUCB61OacQxlRDkxIa1nCfm4N7i'; // Folder ID waar backups naartoe gaan
const GOOGLE_DRIVE_CREDENTIALS_PATH = process.env.DRIVE_CREDENTIALS_PATH || path.join(__dirname, 'service-account-credentials.json');

// Maximum aantal backups om te bewaren in Google Drive (oudere worden verwijderd)
const MAX_BACKUPS_TO_KEEP = 30;

// Een testbestand aanmaken als de credentials niet bestaan (alleen voor ontwikkeling)
if (!fs.existsSync(GOOGLE_DRIVE_CREDENTIALS_PATH)) {
  console.log(`Waarschuwing: Google Drive credentials niet gevonden op: ${GOOGLE_DRIVE_CREDENTIALS_PATH}`);
  console.log('Maak een service-account met Drive API toegang en sla de credentials op in dit bestand');
}

/**
 * Authenticeren bij Google Drive API met service account
 * @returns {Promise<any>} Google Drive API client
 */
async function authenticateGoogleDrive() {
  try {
    if (!fs.existsSync(GOOGLE_DRIVE_CREDENTIALS_PATH)) {
      throw new Error(`Google Drive credentials bestand niet gevonden op: ${GOOGLE_DRIVE_CREDENTIALS_PATH}`);
    }

    const credentials = JSON.parse(fs.readFileSync(GOOGLE_DRIVE_CREDENTIALS_PATH, 'utf8'));
    const { client_email, private_key } = credentials;

    if (!client_email || !private_key) {
      throw new Error('Google Drive credentials ontbreken client_email of private_key');
    }

    const auth = new google.auth.JWT(
      client_email,
      null,
      private_key,
      ['https://www.googleapis.com/auth/drive.file']
    );

    await auth.authorize();
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    throw new Error(`Google Drive authenticatie fout: ${error.message}`);
  }
}

/**
 * Upload een bestand naar Google Drive
 * @param {object} drive - Authenticated Google Drive API client
 * @param {string} filePath - Pad naar het bestand dat geupload moet worden
 * @returns {Promise<object>} Upload resultaat
 */
async function uploadFileToDrive(drive, filePath) {
  try {
    console.log(`Starten met uploaden naar Google Drive: ${filePath}`);
    
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Geen Google Drive folder ID geconfigureerd (DRIVE_FOLDER_ID)');
    }

    const fileName = path.basename(filePath);
    const fileMetadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    console.log(`Bestand succesvol geupload naar Google Drive: ${fileName}`);
    console.log(`File ID: ${response.data.id}`);
    console.log(`Web link: ${response.data.webViewLink}`);

    return response.data;
  } catch (error) {
    throw new Error(`Google Drive upload fout: ${error.message}`);
  }
}

/**
 * Lijst en verwijder oude backups in Google Drive (behoudt de MAX_BACKUPS_TO_KEEP nieuwste)
 * @param {object} drive - Authenticated Google Drive API client
 */
async function cleanupOldBackups(drive) {
  try {
    console.log(`Zoeken naar oude backups om op te ruimen...`);
    
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Geen Google Drive folder ID geconfigureerd (DRIVE_FOLDER_ID)');
    }

    // Zoek alle SQL bestanden in de backup folder
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/sql'`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)',
    });

    const backupFiles = response.data.files || [];
    console.log(`${backupFiles.length} backup bestanden gevonden op Google Drive`);

    if (backupFiles.length <= MAX_BACKUPS_TO_KEEP) {
      console.log(`Geen oude backups om op te ruimen (limiet is ${MAX_BACKUPS_TO_KEEP})`);
      return;
    }

    // Verwijder de oudere backups (behoud de MAX_BACKUPS_TO_KEEP nieuwste)
    const filesToDelete = backupFiles.slice(MAX_BACKUPS_TO_KEEP);
    console.log(`${filesToDelete.length} oude backups worden verwijderd...`);

    for (const file of filesToDelete) {
      console.log(`Verwijderen van oude backup: ${file.name}`);
      await drive.files.delete({ fileId: file.id });
    }

    console.log(`Opruimen van oude backups voltooid. ${filesToDelete.length} bestanden verwijderd.`);
  } catch (error) {
    console.error(`Fout bij opruimen oude backups: ${error.message}`);
  }
}

/**
 * Hoofdfunctie: maak database backup en upload naar Google Drive
 */
async function backupToDrive() {
  try {
    // Stap 1: Maak database backup
    console.log('Stap 1: Database backup starten...');
    const backupResult = await backupDatabase();
    
    if (!backupResult.success) {
      throw new Error(`Database backup mislukt: ${backupResult.error}`);
    }
    
    console.log(`Database backup voltooid: ${backupResult.backupFile}`);
    
    // Stap 2: Authenticeren bij Google Drive
    console.log('Stap 2: Authenticeren bij Google Drive...');
    const drive = await authenticateGoogleDrive();
    console.log('Google Drive authenticatie succesvol');
    
    // Stap 3: Upload de backup naar Google Drive
    console.log('Stap 3: Uploaden naar Google Drive...');
    const uploadResult = await uploadFileToDrive(drive, backupResult.backupPath);
    console.log('Upload naar Google Drive voltooid');
    
    // Stap 4: Opruimen van oude backups in Google Drive
    console.log('Stap 4: Opruimen van oude backups...');
    await cleanupOldBackups(drive);
    
    return {
      success: true,
      localBackupFile: backupResult.backupFile,
      driveFileId: uploadResult.id,
      webLink: uploadResult.webViewLink
    };
  } catch (error) {
    console.error('Google Drive backup fout:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Controleer of het script direct wordt uitgevoerd
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  backupToDrive()
    .then(result => {
      if (result.success) {
        console.log('Google Drive backup proces succesvol afgerond');
        console.log(`Link naar backup: ${result.webLink}`);
      } else {
        console.error('Google Drive backup proces mislukt');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Onverwachte fout in Google Drive backup proces:', err);
      process.exit(1);
    });
}

/**
 * Haalt een lijst op van alle beschikbare backups in Google Drive
 * @returns {Promise<{success: boolean, backups?: Array<Object>, error?: string}>} Resultaat met backup bestanden
 */
async function listDriveBackups() {
  try {
    // Controleer of de Google Drive credentials bestaan
    if (!fs.existsSync(GOOGLE_DRIVE_CREDENTIALS_PATH)) {
      return {
        success: false,
        error: `Google Drive credentials niet gevonden op: ${GOOGLE_DRIVE_CREDENTIALS_PATH}`
      };
    }

    // Controleer of de Google Drive folder ID is geconfigureerd
    if (!GOOGLE_DRIVE_FOLDER_ID) {
      return {
        success: false,
        error: 'Geen Google Drive folder ID geconfigureerd (DRIVE_FOLDER_ID)'
      };
    }

    // Authenticeer bij Google Drive
    console.log('Authenticeren bij Google Drive...');
    const drive = await authenticateGoogleDrive();
    console.log('Google Drive authenticatie succesvol');

    // Zoek alle SQL bestanden in de backup folder
    console.log(`Ophalen van backups uit Google Drive folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/sql'`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime, webViewLink, size)'
    });

    const backupFiles = response.data.files || [];
    console.log(`${backupFiles.length} backup bestanden gevonden op Google Drive`);

    // Formatteer de bestanden voor weergave
    const formattedFiles = backupFiles.map(file => {
      const created = new Date(file.createdTime);
      
      // Converteer byte size naar MB
      const sizeInMB = file.size ? (parseInt(file.size, 10) / (1024 * 1024)).toFixed(2) + ' MB' : 'Onbekend';
      
      return {
        filename: file.name,
        id: file.id, 
        created: created,
        timestamp: created.toISOString(),
        webLink: file.webViewLink,
        size: sizeInMB,
        source: 'drive'  // Om aan te geven dat dit een Google Drive backup is
      };
    });

    return {
      success: true,
      backups: formattedFiles
    };
  } catch (error) {
    console.error('Fout bij ophalen van Google Drive backups:', error.message);
    return {
      success: false,
      error: `Fout bij ophalen van Google Drive backups: ${error.message}`
    };
  }
}

/**
 * Download een Google Drive backup bestand naar de lokale backups map
 * @param {string} fileId - Google Drive file ID van het backup bestand
 * @returns {Promise<{success: boolean, localPath?: string, error?: string}>} Resultaat met local path
 */
async function downloadDriveBackup(fileId) {
  try {
    // Controleer of de Google Drive credentials bestaan
    if (!fs.existsSync(GOOGLE_DRIVE_CREDENTIALS_PATH)) {
      return {
        success: false,
        error: `Google Drive credentials niet gevonden op: ${GOOGLE_DRIVE_CREDENTIALS_PATH}`
      };
    }

    // Authenticeer bij Google Drive
    console.log('Authenticeren bij Google Drive...');
    const drive = await authenticateGoogleDrive();
    console.log('Google Drive authenticatie succesvol');

    // Haal de bestandsgegevens op
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'name'
    });

    if (!fileResponse.data || !fileResponse.data.name) {
      throw new Error(`Bestand niet gevonden: ${fileId}`);
    }

    const fileName = fileResponse.data.name;
    const localDir = path.join(__dirname, 'backups');
    const localPath = path.join(localDir, fileName);

    // Zorg ervoor dat de backups map bestaat
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    console.log(`Downloaden van bestand: ${fileName} (ID: ${fileId})`);

    // Download het bestand
    const dest = fs.createWriteStream(localPath);
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Return een promise die resolvet wanneer het bestand volledig is gedownload
    return new Promise((resolve, reject) => {
      response.data
        .on('error', err => {
          reject(err);
        })
        .on('end', () => {
          console.log(`Bestand succesvol gedownload naar: ${localPath}`);
          resolve({
            success: true,
            localPath: localPath,
            fileName: fileName
          });
        })
        .pipe(dest);
    });
  } catch (error) {
    console.error('Fout bij downloaden van Google Drive backup:', error.message);
    return {
      success: false,
      error: `Fout bij downloaden van Google Drive backup: ${error.message}`
    };
  }
}

// Exporteer de functies voor gebruik in andere scripts
export { backupToDrive, listDriveBackups, downloadDriveBackup };