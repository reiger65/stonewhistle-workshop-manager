-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    shopify_order_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_state TEXT,
    customer_zip TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    serial_number TEXT NOT NULL UNIQUE,
    instrument_type TEXT NOT NULL,
    color_code TEXT,
    status TEXT NOT NULL DEFAULT 'ordered',
    production_stage TEXT NOT NULL DEFAULT 'ordered',
    specifications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create production_notes table
CREATE TABLE IF NOT EXISTS production_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER,
    note_text TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES order_items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create materials_inventory table
CREATE TABLE IF NOT EXISTS materials_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    material_type TEXT NOT NULL,
    quantity_available DECIMAL(10,2),
    unit TEXT NOT NULL,
    supplier TEXT,
    cost_per_unit DECIMAL(10,2),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create instrument_inventory table
CREATE TABLE IF NOT EXISTS instrument_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_name TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    serial_number TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'available',
    location TEXT,
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_inventory table
CREATE TABLE IF NOT EXISTS mold_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mold_name TEXT NOT NULL,
    mold_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    location TEXT,
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_mappings table
CREATE TABLE IF NOT EXISTS mold_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mapping_name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create mold_mapping_items table
CREATE TABLE IF NOT EXISTS mold_mapping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mapping_id INTEGER NOT NULL,
    mold_id INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    FOREIGN KEY (mapping_id) REFERENCES mold_mappings(id),
    FOREIGN KEY (mold_id) REFERENCES mold_inventory(id)
);

-- Create material_mapping_rules table
CREATE TABLE IF NOT EXISTS material_mapping_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    material_id INTEGER NOT NULL,
    instrument_type TEXT NOT NULL,
    quantity_needed DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials_inventory(id)
);

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    item_id INTEGER,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    task_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES order_items(id)
);

-- Create shopify_item_tracking table
CREATE TABLE IF NOT EXISTS shopify_item_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shopify_item_id TEXT NOT NULL,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    tracking_status TEXT NOT NULL,
    last_synced DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES order_items(id)
);

-- Create resellers table
CREATE TABLE IF NOT EXISTS resellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    commission_rate DECIMAL(5,2),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create session table
CREATE TABLE IF NOT EXISTS session (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire DATETIME NOT NULL
);

-- Insert admin user
INSERT OR IGNORE INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@stonewhistle.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
