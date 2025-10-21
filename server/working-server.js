const express = require('express');
const path = require('path');
const cors = require('cors');
const { Client } = require('pg');
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

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint requested');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// Database connection helper
let dbClient = null;

async function getDbClient() {
  if (!dbClient) {
    dbClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await dbClient.connect();
    console.log('✅ Database connected');
  }
  return dbClient;
}

// API endpoints with real database connection
app.get('/api/orders', async (req, res) => {
  console.log('📋 Orders API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM orders ORDER BY "orderNumber" ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.json([]);
  }
});

app.get('/api/order-items', async (req, res) => {
  console.log('📦 Order items API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM order_items ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.json([]);
  }
});

app.get('/api/settings', async (req, res) => {
  console.log('⚙️ Settings API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM settings LIMIT 1');
    const settings = result.rows[0] || { materialSettings: {} };
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.json({ materialSettings: {} });
  }
});

app.get('/api/materials', async (req, res) => {
  console.log('📦 Materials API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM materials WHERE "materialType" = $1', ['box']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.json([]);
  }
});

app.get('/api/molds', async (req, res) => {
  console.log('🔧 Molds API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM mold_inventory WHERE "isActive" = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching molds:', error);
    res.json([]);
  }
});

app.get('/api/mold-mappings', async (req, res) => {
  console.log('🗺️ Mold mappings API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM mold_mappings WHERE "isActive" = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching mold mappings:', error);
    res.json([]);
  }
});

app.get('/api/resellers', async (req, res) => {
  console.log('🏪 Resellers API requested');
  try {
    const client = await getDbClient();
    const result = await client.query('SELECT * FROM resellers WHERE "isActive" = true ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resellers:', error);
    res.json([]);
  }
});

// Authentication endpoints - support both endpoints
app.post('/api/login', (req, res) => {
  console.log('🔐 Login requested (frontend endpoint)');
  console.log('📝 Request body:', req.body);
  const { username, password } = req.body;
  console.log('👤 Username:', username);
  console.log('🔑 Password received:', password);
  console.log('🔑 Expected password: Johannes@@==2025');
  
  // Check for admin credentials
  if (username === 'admin' && password === 'Johannes@@==2025') {
    console.log('✅ Admin login successful');
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  } else {
    console.log('❌ Login failed - invalid credentials');
    console.log('❌ Username match:', username === 'admin');
    console.log('❌ Password match:', password === 'Johannes@@==2025');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login requested');
  console.log('📝 Request body:', req.body);
  const { username, password } = req.body;
  console.log('👤 Username:', username);
  console.log('🔑 Password received:', password);
  console.log('🔑 Expected password: Johannes@@==2025');
  
  // Check for admin credentials
  if (username === 'admin' && password === 'Johannes@@==2025') {
    console.log('✅ Admin login successful');
    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: 1, username: 'admin', role: 'admin' }
    });
  } else {
    console.log('❌ Login failed - invalid credentials');
    console.log('❌ Username match:', username === 'admin');
    console.log('❌ Password match:', password === 'Johannes@@==2025');
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

// User endpoint for authentication check
app.get('/api/user', (req, res) => {
  console.log('👤 User endpoint requested');
  // For now, return null to indicate no user is logged in
  // In a real app, this would check session/cookies
  res.json(null);
});

// Simple test login endpoint
app.post('/api/test-login', (req, res) => {
  console.log('🧪 Test login requested');
  console.log('📝 Request body:', req.body);
  const { username, password } = req.body;
  console.log('👤 Username:', username);
  console.log('🔑 Password:', password);
  
  res.json({ 
    success: true, 
    message: 'Test login successful',
    received: { username, password }
  });
});

// Catch-all handler: send back React's index.html file for any non-API routes
// This must be LAST to avoid intercepting API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Working server running on port ${port}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${port}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Railway deployment ready!`);
});
