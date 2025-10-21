const express = require('express');
const path = require('path');
const app = express();

// Log environment info
console.log('🔍 Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Basic middleware
app.use(express.json());

// Serve static files from the built React app
app.use(express.static(path.join(__dirname, '../dist/public')));

// API routes
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Simple health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'ok',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Minimal server is working!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Stonewhistle Workshop Manager - Minimal Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${port}`);
});
