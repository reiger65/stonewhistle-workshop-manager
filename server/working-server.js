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

// Mock API endpoints with sample data
app.get('/api/orders', (req, res) => {
  console.log('📋 Orders API requested');
  const sampleOrders = [
    {
      id: 1,
      orderNumber: 'SW-1001',
      status: 'pending',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      orderNumber: 'SW-1002',
      status: 'in_progress',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  res.json(sampleOrders);
});

app.get('/api/order-items', (req, res) => {
  console.log('📦 Order items API requested');
  const sampleItems = [
    {
      id: 1,
      orderId: 1,
      instrumentType: 'INNATO',
      tuningNote: 'Gm3',
      serialNumber: 'SW001',
      status: 'pending'
    },
    {
      id: 2,
      orderId: 1,
      instrumentType: 'NATEY',
      tuningNote: 'Am4',
      serialNumber: 'SW002',
      status: 'in_progress'
    }
  ];
  res.json(sampleItems);
});

app.get('/api/settings', (req, res) => {
  console.log('⚙️ Settings API requested');
  res.json({ 
    materialSettings: {
      defaultBoxMaterial: 'Standard Box',
      defaultBagMaterial: 'Standard Bag'
    }
  });
});

app.get('/api/materials', (req, res) => {
  console.log('📦 Materials API requested');
  const sampleMaterials = [
    {
      id: 1,
      name: 'Standard Box',
      type: 'box',
      quantity: 100,
      isActive: true
    },
    {
      id: 2,
      name: 'Premium Box',
      type: 'box',
      quantity: 50,
      isActive: true
    }
  ];
  res.json(sampleMaterials);
});

app.get('/api/molds', (req, res) => {
  console.log('🔧 Molds API requested');
  const sampleMolds = [
    {
      id: 1,
      name: '12 17 19',
      instrumentType: 'INNATO',
      isActive: true
    },
    {
      id: 2,
      name: '14',
      instrumentType: 'NATEY',
      isActive: true
    }
  ];
  res.json(sampleMolds);
});

app.get('/api/mold-mappings', (req, res) => {
  console.log('🗺️ Mold mappings API requested');
  res.json([]);
});

app.get('/api/resellers', (req, res) => {
  console.log('🏪 Resellers API requested');
  const sampleResellers = [
    {
      id: 1,
      name: 'Music Store A',
      isActive: true
    },
    {
      id: 2,
      name: 'Music Store B',
      isActive: true
    }
  ];
  res.json(sampleResellers);
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
