const express = require('express');
const path = require('path');
const cors = require('cors');
const { Client } = require('pg');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../dist/public')));

// Database connection
let dbClient = null;
async function getDbClient() {
  if (!dbClient && process.env.DATABASE_URL) {
    try {
      dbClient = new Client({ connectionString: process.env.DATABASE_URL });
      await dbClient.connect();
      console.log('✅ Database connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }
  return dbClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM orders ORDER BY "orderNumber" ASC');
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.json([]);
  }
});

app.get('/api/order-items', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM order_items ORDER BY id ASC');
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching order items:', error.message);
    res.json([]);
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM settings LIMIT 1');
      res.json(result.rows[0] || { materialSettings: {} });
    } else {
      res.json({ materialSettings: {} });
    }
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    res.json({ materialSettings: {} });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM materials WHERE "materialType" = $1', ['box']);
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching materials:', error.message);
    res.json([]);
  }
});

app.get('/api/molds', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM mold_inventory WHERE "isActive" = true ORDER BY name ASC');
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching molds:', error.message);
    res.json([]);
  }
});

app.get('/api/mold-mappings', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM mold_mappings WHERE "isActive" = true ORDER BY name ASC');
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching mold mappings:', error.message);
    res.json([]);
  }
});

app.get('/api/resellers', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM resellers WHERE "isActive" = true ORDER BY name ASC');
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching resellers:', error.message);
    res.json([]);
  }
});

// Authentication
app.post('/api/login', (req, res) => {
  console.log('🔐 Login attempt:', req.body);
  const { username, password } = req.body;
  if (username === 'admin' && password === 'Johannes@@==2025') {
    console.log('✅ Login successful');
    res.json({ success: true, message: 'Login successful', user: { id: 1, username: 'admin' } });
  } else {
    console.log('❌ Login failed');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/user', (req, res) => {
  res.json(null);
});

// Catch-all for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});
