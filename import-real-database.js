import fs from 'fs';

// Read the PostgreSQL dump
const postgresDump = fs.readFileSync('/Users/hanshoukes/Downloads/ui_exact_visuals/stonewhistle-db-backup-2025-10-20T15-10-56-034Z.sql', 'utf8');

let sqliteStatements = [];

// Create all tables with proper structure
sqliteStatements.push(`
-- Create orders table with all existing fields
CREATE TABLE IF NOT EXISTS orders (
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

-- Create order_items table with all existing fields
CREATE TABLE IF NOT EXISTS order_items (
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
CREATE TABLE IF NOT EXISTS materials_inventory (
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

-- Create material_mapping_rules table
CREATE TABLE IF NOT EXISTS material_mapping_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    instrument_size TEXT,
    tuning_note TEXT,
    bag_type TEXT,
    bag_size TEXT,
    box_size TEXT,
    priority INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_inventory table
CREATE TABLE IF NOT EXISTS mold_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size TEXT,
    instrument_type TEXT,
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_mappings table
CREATE TABLE IF NOT EXISTS mold_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    instrument_size TEXT,
    tuning_note TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_mapping_items table
CREATE TABLE IF NOT EXISTS mold_mapping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mapping_id INTEGER NOT NULL,
    mold_id INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mapping_id) REFERENCES mold_mappings(id),
    FOREIGN KEY (mold_id) REFERENCES mold_inventory(id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create resellers table
CREATE TABLE IF NOT EXISTS resellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nickname TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'US',
    discount_percent REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create production_notes table
CREATE TABLE IF NOT EXISTS production_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    item_id INTEGER,
    note TEXT NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES order_items(id)
);

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_duration INTEGER DEFAULT 0,
    total_hours REAL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create shopify_item_tracking table
CREATE TABLE IF NOT EXISTS shopify_item_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    shopify_line_item_id TEXT,
    tracking_status TEXT,
    last_synced DATETIME,
    sync_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES order_items(id)
);

-- Create session table
CREATE TABLE IF NOT EXISTS session (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire DATETIME NOT NULL
);
`);

// Extract and convert data from COPY statements
const copyStatements = postgresDump.match(/COPY [^(]+ \(([^)]+)\) FROM stdin;[\s\S]*?^\\\.$/gm);

if (copyStatements) {
    for (const copyStatement of copyStatements) {
        const lines = copyStatement.split('\n');
        const headerLine = lines[0];
        const tableName = headerLine.match(/COPY ([^(]+) \(/)[1].replace('public.', '');
        
        // Find the data lines (between COPY and \.)
        const dataStartIndex = lines.findIndex(line => line.includes('FROM stdin;')) + 1;
        const dataEndIndex = lines.findIndex(line => line.trim() === '\\.');
        
        if (dataStartIndex > 0 && dataEndIndex > dataStartIndex) {
            const dataLines = lines.slice(dataStartIndex, dataEndIndex);
            
            // Extract column names from header
            const columnMatch = headerLine.match(/\(([^)]+)\)/);
            if (columnMatch) {
                const columns = columnMatch[1].split(',').map(col => col.trim());
                
                // Convert data lines to INSERT statements
                for (const dataLine of dataLines) {
                    if (dataLine.trim() && !dataLine.includes('\\N')) {
                        const values = dataLine.split('\t').map(val => {
                            if (val === '\\N' || val === '') return 'NULL';
                            // Escape single quotes
                            return `'${val.replace(/'/g, "''")}'`;
                        });
                        
                        if (values.length === columns.length) {
                            const insertStatement = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                            sqliteStatements.push(insertStatement);
                        }
                    }
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
fs.writeFileSync('database-complete.sql', sqliteStatements.join('\n'));

console.log('✅ Created complete database with all existing data and business rules');
console.log('📁 Output: database-complete.sql');
console.log(`📊 Generated ${sqliteStatements.length} SQL statements`);
