/**
 * Database backup and restore routes for Stonewhistle Workshop
 * 
 * REST API endpoints for creating, downloading, and restoring database backups
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage for upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'temp-upload-' + Date.now() + '.sql');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept .sql files
    if (path.extname(file.originalname) !== '.sql') {
      return cb(new Error('Only .sql files are allowed'));
    }
    cb(null, true);
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

// Helper to get file creation date
function getFileDate(filePath) {
  const stats = fs.statSync(filePath);
  return stats.birthtime;
}

const router = express.Router();

// Create a new database backup
router.post('/create-backup', async (req, res) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/g, '');
    const backupFilename = `backup_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../../backups', backupFilename);
    
    // Ensure backups directory exists
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Use pg_dump to create backup
    // Relies on DATABASE_URL environment variable
    const { stdout, stderr } = await execPromise(
      `pg_dump -c --if-exists "${process.env.DATABASE_URL}" > "${backupPath}"`
    );
    
    if (stderr && !stderr.includes('warning')) {
      throw new Error(`pg_dump error: ${stderr}`);
    }
    
    res.json({ 
      success: true, 
      filename: backupFilename,
      message: 'Database backup created successfully'
    });
  } catch (error) {
    console.error('Database backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create database backup'
    });
  }
});

// Get list of available backups
router.get('/backups', (req, res) => {
  try {
    const backupsDir = path.join(__dirname, '../../backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = getFileDate(filePath);
        
        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          date: fileDate.toISOString(),
          dateFormatted: fileDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
    
    res.json(files);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list database backups'
    });
  }
});

// Download a backup file
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const backupPath = path.join(__dirname, '../../backups', filename);
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }
    
    // Send file for download
    res.download(backupPath);
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download backup'
    });
  }
});

// Delete a backup file
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security check: Ensure filename only contains safe characters
    if (!/^[a-zA-Z0-9_\-\.]+\.sql$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }
    
    const backupPath = path.join(__dirname, '../../backups', filename);
    
    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }
    
    // Delete the file
    fs.unlinkSync(backupPath);
    
    res.json({
      success: true,
      message: `Backup ${filename} deleted successfully`
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete backup'
    });
  }
});

// Upload and restore a database backup
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No backup file uploaded'
      });
    }
    
    const uploadedFilePath = req.file.path;
    
    // Create a copy of the uploaded file in the backups directory with a timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/g, '');
    const backupFilename = `backup_uploaded_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../../backups', backupFilename);
    
    // Ensure backups directory exists
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Copy the uploaded file to backups directory
    fs.copyFileSync(uploadedFilePath, backupPath);
    
    // Start restore process (will happen in background)
    const restoreCommand = `node restore-database.js "${backupPath}" --restart`;
    
    // Start the restore process as a detached process
    const restoreProcess = exec(restoreCommand, { detached: true });
    restoreProcess.unref(); // Allow the process to run independently
    
    // Clean up the temp file
    try {
      fs.unlinkSync(uploadedFilePath);
    } catch (cleanupError) {
      console.error('Failed to clean up temp file:', cleanupError);
    }
    
    res.json({
      success: true,
      message: 'Database restore process started. The application will restart shortly.'
    });
  } catch (error) {
    console.error('Database restore error:', error);
    
    // Clean up the temp file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore database'
    });
  }
});

export default router;