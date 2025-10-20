import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { RequestHandler } from 'express-serve-static-core';

const router = Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backups/');
  },
  filename: (req, file, cb) => {
    // Keep original filename for uploaded backups
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only .sql files
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Only .sql files are allowed'));
    }
  }
});

// Get list of available backups
router.get('/list', (req, res) => {
  const backupsDir = path.join(process.cwd(), 'backups');
  
  // Make sure backups directory exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  fs.readdir(backupsDir, (err, files) => {
    if (err) {
      console.error('Error reading backups directory:', err);
      return res.status(500).json({ error: 'Failed to read backups directory' });
    }
    
    // Filter only .sql files and sort by date (newest first)
    const backupFiles = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(backupsDir, file));
        return {
          name: file,
          size: stats.size,
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    res.json(backupFiles);
  });
});

// Create a new backup
router.post('/create', (req, res) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupFilename = `backup_${timestamp}.sql`;
  const backupPath = path.join(process.cwd(), 'backups', backupFilename);
  
  // Use pg_dump to create a backup
  const command = `pg_dump -U ${process.env.PGUSER} -h ${process.env.PGHOST} -p ${process.env.PGPORT} -d ${process.env.PGDATABASE} -f ${backupPath}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to create backup', details: error.message });
    }
    
    if (stderr && !stderr.includes('connecting to database')) {
      console.error(`Backup stderr: ${stderr}`);
      return res.status(500).json({ error: 'Backup command error', details: stderr });
    }
    
    console.log(`Backup created successfully: ${backupFilename}`);
    res.json({ success: true, filename: backupFilename });
  });
});

// Download a specific backup
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'backups', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }
  
  res.download(filePath);
});

// Upload and restore a backup
router.post('/restore', upload.single('backupFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No backup file provided' });
  }
  
  const backupPath = req.file.path;
  
  // Use psql to restore the backup
  const command = `psql -U ${process.env.PGUSER} -h ${process.env.PGHOST} -p ${process.env.PGPORT} -d ${process.env.PGDATABASE} -f ${backupPath}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to restore backup', details: error.message });
    }
    
    console.log(`Backup restored successfully from ${req.file.originalname}`);
    res.json({ success: true, message: 'Backup restored successfully' });
  });
});

export default router;