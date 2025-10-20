/**
 * Database Manager routes
 * 
 * API endpoints voor het beheren van database backups
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execPromise = promisify(exec);

// Configureer multer voor file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store uploads in the backups directory
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    cb(null, backupDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only .sql files
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Alleen .sql bestanden zijn toegestaan'));
    }
  }
});

// Helper functie om bestandsgroottes te formatteren
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

// Lijst van backups ophalen
router.get('/backups', (req, res) => {
  try {
    const backupDir = path.resolve(process.cwd(), 'backups');
    
    // Zorg ervoor dat de backups map bestaat
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Lees alle bestanden in de map
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          dateFormatted: stats.mtime.toLocaleString()
        };
      })
      // Sorteer op datum, nieuwste eerst
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(files);
  } catch (error) {
    console.error('Fout bij ophalen backups:', error);
    res.status(500).json({ 
      error: 'Kon backup lijst niet ophalen', 
      details: error.message 
    });
  }
});

// Nieuwe backup maken
router.post('/create-backup', async (req, res) => {
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
    const backupFileName = `stonewhistle-backup-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.sql`;
    const backupDir = path.resolve(process.cwd(), 'backups');
    const backupFilePath = path.join(backupDir, backupFileName);
    
    // Zorg ervoor dat de backups map bestaat
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log(`Backup starten naar: ${backupFilePath}`);

    // Voer pg_dump uit met database inloggegevens
    const pgDumpCommand = `PGPASSWORD="${PGPASSWORD}" pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -F p -b -v -f "${backupFilePath}" ${PGDATABASE}`;
    
    const { stdout, stderr } = await execPromise(pgDumpCommand);
    
    if (stderr && stderr.includes('ERROR')) {
      throw new Error(`Database backup fout: ${stderr}`);
    }

    // Controleer of het bestand is aangemaakt en welke grootte het heeft
    if (fs.existsSync(backupFilePath)) {
      const stats = fs.statSync(backupFilePath);
      
      console.log(`Database backup voltooid: ${backupFileName}`);
      console.log(`Bestandsgrootte: ${formatFileSize(stats.size)}`);
      
      // Sla de datum van de laatste backup op in een tekstbestand
      fs.writeFileSync(
        path.join(process.cwd(), 'laatste-backup.txt'), 
        `Laatste backup gemaakt op: ${now.toLocaleString()}\nBestandsnaam: ${backupFileName}`
      );
      
      res.json({
        success: true,
        filename: backupFileName,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        date: now.toISOString(),
        dateFormatted: now.toLocaleString()
      });
    } else {
      throw new Error('Backup bestand werd niet aangemaakt');
    }
  } catch (error) {
    console.error('Database backup fout:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Backup downloaden
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const backupDir = path.resolve(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup bestand niet gevonden' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Fout bij downloaden backup:', error);
    res.status(500).json({ 
      error: 'Kon backup niet downloaden', 
      details: error.message 
    });
  }
});

// Backup verwijderen
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const backupDir = path.resolve(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup bestand niet gevonden' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true, message: `Backup ${filename} is verwijderd` });
  } catch (error) {
    console.error('Fout bij verwijderen backup:', error);
    res.status(500).json({ 
      error: 'Kon backup niet verwijderen', 
      details: error.message 
    });
  }
});

// Backup uploaden en herstellen
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen backup bestand ontvangen' });
    }
    
    const backupFilePath = req.file.path;
    const backupFileName = req.file.filename;
    
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
    const now = new Date();
    fs.writeFileSync(
      path.join(process.cwd(), 'laatste-restore.txt'), 
      `Laatste restore uitgevoerd op: ${now.toLocaleString()}\nVanuit bestand: ${backupFileName}`
    );
    
    console.log(`Database hersteld vanuit backup: ${backupFileName}`);
    
    res.json({ 
      success: true,
      message: `Database succesvol hersteld vanuit ${backupFileName}`
    });
  } catch (error) {
    console.error('Fout bij herstellen van database:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;