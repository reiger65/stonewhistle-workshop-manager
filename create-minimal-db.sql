-- Create tables
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_urgent BOOLEAN DEFAULT 0
);

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

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert some active orders (not archived)
INSERT INTO orders (order_number, customer_name, customer_email, status, order_date, notes, archived) VALUES 
('SW-1690', 'John Smith', 'john@example.com', 'ordered', '2025-10-15', 'Active order 1', 0),
('SW-1691', 'Jane Doe', 'jane@example.com', 'ordered', '2025-10-16', 'Active order 2', 0),
('SW-1692', 'Bob Wilson', 'bob@example.com', 'ordered', '2025-10-17', 'Active order 3', 0);

-- Insert order items for these orders
INSERT INTO order_items (order_id, serial_number, item_type, status, specifications) VALUES 
(1, 'SN1690-1', 'INNATO_A3', 'ordered', '{"type":"Innato A3","model":"INNATO","tuning":"A3"}'),
(2, 'SN1691-1', 'NATEY_F4', 'ordered', '{"type":"Natey F4","model":"NATEY","tuning":"F4"}'),
(3, 'SN1692-1', 'DOUBLE_G3', 'ordered', '{"type":"Double G3","model":"DOUBLE","tuning":"G3"}');

-- Insert admin user
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@stonewhistle.com', '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0', 'admin');


