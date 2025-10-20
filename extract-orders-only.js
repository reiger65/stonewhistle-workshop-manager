import fs from 'fs';

// Read the PostgreSQL dump
const postgresDump = fs.readFileSync('/Users/hanshoukes/Downloads/ui_exact_visuals/stonewhistle-db-backup-2025-10-20T15-10-56-034Z.sql', 'utf8');

let sqliteStatements = [];

// Create only essential tables
sqliteStatements.push(`
-- Drop existing tables to start fresh
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS materials_inventory;
DROP TABLE IF EXISTS users;

-- Create orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    shopify_order_id TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_state TEXT,
    customer_zip TEXT,
    customer_country TEXT,
    order_type TEXT DEFAULT 'retail',
    is_reseller BOOLEAN DEFAULT 0,
    reseller_nickname TEXT,
    status TEXT DEFAULT 'ordered',
    order_date DATETIME,
    deadline DATETIME,
    notes TEXT,
    progress INTEGER DEFAULT 0,
    specifications TEXT,
    status_change_dates TEXT,
    build_date DATETIME,
    archived BOOLEAN DEFAULT 0,
    tracking_number TEXT,
    tracking_company TEXT,
    tracking_url TEXT,
    shipped_date DATETIME,
    estimated_delivery_date DATETIME,
    delivery_status TEXT,
    delivered_date DATETIME,
    is_urgent BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    serial_number TEXT,
    item_type TEXT,
    item_size TEXT,
    tuning_type TEXT,
    color TEXT,
    weight REAL,
    craftsperson TEXT,
    order_number TEXT,
    order_date DATETIME,
    deadline DATETIME,
    build_date DATETIME,
    bag_size TEXT,
    box_size TEXT,
    shopify_line_item_id TEXT,
    specifications TEXT,
    status TEXT DEFAULT 'ordered',
    progress INTEGER DEFAULT 0,
    status_change_dates TEXT,
    is_archived BOOLEAN DEFAULT 0,
    archived_reason TEXT,
    workshop_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create materials_inventory table
CREATE TABLE materials_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    material_type TEXT,
    bag_type TEXT,
    size TEXT,
    quantity INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    ordered INTEGER DEFAULT 0,
    expected_delivery DATETIME,
    order_date DATETIME,
    order_reference TEXT,
    display_order INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Extract only orders and order_items data
const ordersMatch = postgresDump.match(/COPY public\.orders \(([^)]+)\) FROM stdin;[\s\S]*?^\\\.$/m);
const orderItemsMatch = postgresDump.match(/COPY public\.order_items \(([^)]+)\) FROM stdin;[\s\S]*?^\\\.$/m);

// Process orders
if (ordersMatch) {
    const lines = ordersMatch[0].split('\n');
    const headerLine = lines[0];
    const columns = headerLine.match(/\(([^)]+)\)/)[1].split(',').map(col => col.trim());
    
    const dataStartIndex = lines.findIndex(line => line.includes('FROM stdin;')) + 1;
    const dataEndIndex = lines.findIndex(line => line.trim() === '\\.');
    
    if (dataStartIndex > 0 && dataEndIndex > dataStartIndex) {
        const dataLines = lines.slice(dataStartIndex, dataEndIndex);
        
        for (const dataLine of dataLines) {
            if (dataLine.trim()) {
                const values = dataLine.split('\t').map(val => {
                    if (val === '\\N' || val === '') return 'NULL';
                    return `'${val.replace(/'/g, "''")}'`;
                });
                
                if (values.length === columns.length) {
                    const insertStatement = `INSERT INTO orders (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                    sqliteStatements.push(insertStatement);
                }
            }
        }
    }
}

// Process order_items
if (orderItemsMatch) {
    const lines = orderItemsMatch[0].split('\n');
    const headerLine = lines[0];
    const columns = headerLine.match(/\(([^)]+)\)/)[1].split(',').map(col => col.trim());
    
    const dataStartIndex = lines.findIndex(line => line.includes('FROM stdin;')) + 1;
    const dataEndIndex = lines.findIndex(line => line.trim() === '\\.');
    
    if (dataStartIndex > 0 && dataEndIndex > dataStartIndex) {
        const dataLines = lines.slice(dataStartIndex, dataEndIndex);
        
        for (const dataLine of dataLines) {
            if (dataLine.trim()) {
                const values = dataLine.split('\t').map(val => {
                    if (val === '\\N' || val === '') return 'NULL';
                    return `'${val.replace(/'/g, "''")}'`;
                });
                
                if (values.length === columns.length) {
                    const insertStatement = `INSERT INTO order_items (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                    sqliteStatements.push(insertStatement);
                }
            }
        }
    }
}

// Add a test admin user
sqliteStatements.push(`
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@stonewhistle.com', '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0', 'admin');
`);

// Write the SQLite statements
fs.writeFileSync('database-orders-only.sql', sqliteStatements.join('\n'));

console.log('✅ Created database with orders and order_items only');
console.log('📁 Output: database-orders-only.sql');
console.log(`📊 Generated ${sqliteStatements.length} SQL statements`);


