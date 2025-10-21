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

// Debug: Check if static files exist
app.get('/api/check-files', (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, '../dist/public');
  const indexPath = path.join(publicPath, 'index.html');
  
  res.json({
    publicPath,
    indexPath,
    publicExists: fs.existsSync(publicPath),
    indexExists: fs.existsSync(indexPath),
    files: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'Directory not found'
  });
});

// Database connection
let dbClient = null;
async function getDbClient() {
  if (!dbClient && process.env.DATABASE_URL) {
    try {
      console.log('🔌 Attempting database connection...');
      console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
      dbClient = new Client({ connectionString: process.env.DATABASE_URL });
      await dbClient.connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('❌ Full error:', error);
    }
  } else if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable not set');
  }
  return dbClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Debug endpoint to check database tables
app.get('/api/debug', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      // List all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Check if orders table exists and get its structure
      let ordersStructure = null;
      try {
        const structureResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'orders'
          ORDER BY ordinal_position
        `);
        ordersStructure = structureResult.rows;
      } catch (err) {
        ordersStructure = `Error: ${err.message}`;
      }
      
      res.json({
        tables: tablesResult.rows.map(row => row.table_name),
        ordersStructure: ordersStructure,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ error: 'No database connection' });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Test endpoint to check if the issue is with the data format
app.get('/api/test-orders', async (req, res) => {
  console.log('🧪 Test orders endpoint requested');
  try {
    const client = await getDbClient();
    if (client) {
      console.log('🔍 Querying database for test orders...');
      const result = await client.query('SELECT * FROM orders ORDER BY order_number ASC LIMIT 3');
      console.log(`✅ Found ${result.rows.length} test orders in database`);
      
      // Log first order to see the structure
      if (result.rows.length > 0) {
        console.log('📋 First test order structure:', JSON.stringify(result.rows[0], null, 2));
      }
      
      res.json({
        success: true,
        count: result.rows.length,
        orders: result.rows,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ No database connection for test');
      res.json({ success: false, error: 'No database connection' });
    }
  } catch (error) {
    console.error('❌ Error fetching test orders:', error.message);
    res.json({ success: false, error: error.message });
  }
});

// API endpoints
app.get('/api/orders', async (req, res) => {
  console.log('📋 Orders API requested');
  try {
    const client = await getDbClient();
    if (client) {
      console.log('🔍 Querying database for orders...');
      const result = await client.query('SELECT * FROM orders ORDER BY order_number ASC');
      console.log(`✅ Found ${result.rows.length} orders in database`);
      
      // Transform snake_case to camelCase for frontend compatibility
      const transformedOrders = result.rows.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        shopifyOrderId: order.shopify_order_id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        customerAddress: order.customer_address,
        customerCity: order.customer_city,
        customerState: order.customer_state,
        customerZip: order.customer_zip,
        customerCountry: order.customer_country,
        orderType: order.order_type,
        isReseller: order.is_reseller,
        resellerNickname: order.reseller_nickname,
        status: order.status,
        orderDate: order.order_date,
        deadline: order.deadline,
        notes: order.notes,
        progress: order.progress,
        specifications: order.specifications,
        statusChangeDates: order.status_change_dates,
        buildDate: order.build_date,
        archived: order.archived,
        trackingNumber: order.tracking_number,
        trackingCompany: order.tracking_company,
        trackingUrl: order.tracking_url,
        shippedDate: order.shipped_date,
        estimatedDeliveryDate: order.estimated_delivery_date,
        deliveryStatus: order.delivery_status,
        deliveredDate: order.delivered_date,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        isUrgent: order.is_urgent
      }));
      
      // Log first transformed order to see the structure
      if (transformedOrders.length > 0) {
        console.log('📋 First transformed order structure:', JSON.stringify(transformedOrders[0], null, 2));
      }
      
      // Add a debug flag to confirm we're using the updated code
      const response = transformedOrders.map(order => ({
        ...order,
        _debug: 'camelCase-transformed'
      }));
      
      res.json(response);
    } else {
      console.log('❌ No database connection');
      res.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
    res.json([]);
  }
});

app.get('/api/order-items', async (req, res) => {
  try {
    const client = await getDbClient();
    if (client) {
      const result = await client.query('SELECT * FROM order_items ORDER BY id ASC');
      
      // Transform snake_case to camelCase for frontend compatibility
      const transformedItems = result.rows.map(item => ({
        id: item.id,
        orderId: item.order_id,
        serialNumber: item.serial_number,
        status: item.status,
        itemName: item.item_name,
        orderNumber: item.order_number,
        archived: item.archived,
        isArchived: item.is_archived,
        checkboxes: item.checkboxes,
        statusChangeDates: item.status_change_dates,
        itemType: item.item_type,
        tuning: item.tuning,
        specifications: item.specifications,
        shopifyLineItemId: item.shopify_line_item_id,
        isDeleted: item.is_deleted
      }));
      
      res.json(transformedItems);
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
      // Try to get settings from a table that exists, or return default
      const result = await client.query('SELECT * FROM workshop_settings LIMIT 1');
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
      const result = await client.query('SELECT * FROM materials WHERE material_type = $1', ['box']);
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
      const result = await client.query('SELECT * FROM mold_inventory WHERE is_active = true ORDER BY name ASC');
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
      const result = await client.query('SELECT * FROM mold_mappings WHERE is_active = true ORDER BY name ASC');
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
      const result = await client.query('SELECT * FROM resellers WHERE is_active = true ORDER BY name ASC');
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

// Status update endpoints for checkboxes
app.patch('/api/order-items/:id/status', async (req, res) => {
  console.log('📝 Order item status update requested for item', req.params.id);
  try {
    const client = await getDbClient();
    if (!client) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const itemId = parseInt(req.params.id);
    const { status, checked } = req.body;

    console.log(`Updating item ${itemId} status ${status} to ${checked ? 'checked' : 'unchecked'}`);

    // Update the item status in the database
    if (checked) {
      // When checkbox is checked, update the status
      await client.query(
        'UPDATE order_items SET status = $1 WHERE id = $2',
        [status, itemId]
      );
      console.log(`✅ Updated item ${itemId} status to ${status}`);
    } else {
      // When checkbox is unchecked, set status back to ordered
      await client.query(
        'UPDATE order_items SET status = $1 WHERE id = $2',
        ['ordered', itemId]
      );
      console.log(`✅ Reset item ${itemId} status to ordered`);
    }
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  console.log('📝 Order status update requested for order', req.params.id);
  try {
    const client = await getDbClient();
    if (!client) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const orderId = parseInt(req.params.id);
    const { status, checked } = req.body;

    console.log(`Updating order ${orderId} status ${status} to ${checked ? 'checked' : 'unchecked'}`);

    // Update the order status in the database
    if (checked) {
      // When checkbox is checked, update the status
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        [status, orderId]
      );
      console.log(`✅ Updated order ${orderId} status to ${status}`);
    } else {
      // When checkbox is unchecked, set status back to ordered
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['ordered', orderId]
      );
      console.log(`✅ Reset order ${orderId} status to ordered`);
    }
    
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
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
