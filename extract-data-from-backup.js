import fs from 'fs';

// Read the PostgreSQL dump
const postgresDump = fs.readFileSync('/Users/hanshoukes/Downloads/ui_exact_visuals/stonewhistle-db-backup-2025-10-20T15-10-56-034Z.sql', 'utf8');

// Extract data from COPY statements
const copyStatements = postgresDump.match(/COPY [^(]+ \(([^)]+)\) FROM stdin;[\s\S]*?^\.$/gm);

let sqliteStatements = [];

// Create tables first
sqliteStatements.push(`
-- Create orders table
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
    status TEXT DEFAULT 'ordered',
    total_amount REAL,
    notes TEXT,
    order_date DATETIME,
    shipped_date DATETIME,
    delivered_date DATETIME,
    tracking_number TEXT,
    tracking_url TEXT,
    tracking_company TEXT,
    delivery_status TEXT,
    order_type TEXT,
    is_urgent BOOLEAN DEFAULT 0,
    is_reseller BOOLEAN DEFAULT 0,
    reseller_nickname TEXT,
    archived BOOLEAN DEFAULT 0,
    specifications TEXT,
    status_change_dates TEXT,
    build_date DATETIME,
    progress INTEGER DEFAULT 0,
    deadline DATETIME,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    serial_number TEXT,
    instrument_type TEXT,
    color_code TEXT,
    status TEXT DEFAULT 'ordered',
    production_stage TEXT DEFAULT 'ordered',
    specifications TEXT,
    tuning TEXT,
    tuning_type TEXT,
    frequency TEXT,
    progress INTEGER DEFAULT 0,
    weight REAL,
    workshop_notes TEXT,
    order_date DATETIME,
    build_date DATETIME,
    shopify_line_item_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create materials_inventory table
CREATE TABLE IF NOT EXISTS materials_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    material_type TEXT,
    size TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT,
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
`);

// Extract and convert data from COPY statements
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

// Write the SQLite statements
fs.writeFileSync('database-clean.sql', sqliteStatements.join('\n'));

console.log('✅ Extracted data from PostgreSQL backup');
console.log('📁 Output: database-clean.sql');
console.log(`📊 Generated ${sqliteStatements.length} SQL statements`);


