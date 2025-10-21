const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Log environment info
console.log('🔍 Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the built React app
app.use(express.static(path.join(__dirname, '../dist/public')));

// Essential API endpoints for the frontend
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mock API endpoints to prevent frontend errors
app.get('/api/orders', (req, res) => {
  console.log('📋 Orders API requested');
  res.json([]);
});

app.get('/api/order-items', (req, res) => {
  console.log('📦 Order items API requested');
  res.json([]);
});

app.get('/api/settings', (req, res) => {
  console.log('⚙️ Settings API requested');
  res.json({ materialSettings: {} });
});

app.get('/api/materials', (req, res) => {
  console.log('📦 Materials API requested');
  res.json([]);
});

app.get('/api/molds', (req, res) => {
  console.log('🔧 Molds API requested');
  res.json([]);
});

app.get('/api/mold-mappings', (req, res) => {
  console.log('🗺️ Mold mappings API requested');
  res.json([]);
});

app.get('/api/resellers', (req, res) => {
  console.log('🏪 Resellers API requested');
  res.json([]);
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login requested');
  const { username, password } = req.body;
  
  // Check for admin credentials
  if (username === 'admin' && password === 'St0n3Fl%te$h0p@2025#!') {
    console.log('✅ Admin login successful');
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  } else {
    console.log('❌ Login failed - invalid credentials');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('🚪 Logout requested');
  res.json({ success: true, message: 'Logout successful' });
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Working server running on port ${port}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${port}`);
});
