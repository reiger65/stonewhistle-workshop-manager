
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

INSERT INTO instrument_inventory (id, serial_number, instrument_type, tuning_type, color, date_produced, status, location, craftsperson, notes, price, created_at, updated_at) VALUES ('1', 'SW-I5001', 'INNATO_F3', 'B', 'terra', '2025-04-01 00:00:00', 'available', 'showroom', 'Marco', 'Testmodel voor het systeem', '149995', '2025-04-01 12:34:56', '2025-04-01 12:34:56');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('81', '60', '41', '0', '2025-05-15 05:32:26.465278');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('83', '62', '43', '0', '2025-05-15 05:32:50.604775');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('86', '64', '44', '0', '2025-05-15 05:33:15.454187');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('87', '65', '45', '0', '2025-05-15 05:33:25.188476');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('90', '66', '45', '0', '2025-05-15 05:33:44.45193');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('91', '67', '46', '0', '2025-05-15 05:33:57.998668');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('93', '69', '51', '0', '2025-05-15 05:34:54.580089');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('94', '70', '52', '0', '2025-05-15 05:35:00.14155');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('95', '71', '53', '0', '2025-05-15 05:35:56.908399');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('99', '72', '53', '0', '2025-05-15 05:36:24.660081');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('101', '73', '53', '0', '2025-05-15 05:36:39.76461');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('102', '74', '54', '0', '2025-05-15 05:36:52.997771');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('104', '75', '54', '0', '2025-05-15 05:37:09.903126');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('106', '76', '54', '0', '2025-05-15 05:37:30.378645');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('109', '77', '55', '0', '2025-05-15 05:38:05.084768');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('111', '53', '57', '0', '2025-05-15 08:55:31.977704');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('65', '49', '34', '0', '2025-05-15 05:29:08.28304');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('114', '47', '33', '0', '2025-05-17 14:55:42.181613');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('67', '50', '34', '0', '2025-05-15 05:29:33.465468');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('68', '51', '36', '0', '2025-05-15 05:29:53.91652');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('70', '52', '36', '0', '2025-05-15 05:30:13.243478');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('72', '54', '38', '0', '2025-05-15 05:30:33.056488');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('74', '55', '38', '0', '2025-05-15 05:30:55.47463');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('75', '56', '39', '0', '2025-05-15 05:31:06.951905');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('76', '57', '40', '0', '2025-05-15 05:31:17.31089');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('78', '58', '40', '0', '2025-05-15 05:31:29.010286');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('124', '42', '29', '0', '2025-05-20 12:02:56.548066');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('127', '44', '30', '0', '2025-05-20 12:03:42.976881');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('128', '45', '31', '0', '2025-05-20 12:03:53.69706');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('129', '46', '32', '0', '2025-05-20 12:04:13.337405');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('131', '68', '48', '0', '2025-06-17 12:57:25.900379');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('132', '63', '44', '0', '2025-06-24 10:48:26.350272');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('134', '43', '58', '0', '2025-07-16 09:34:26.756949');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('135', '41', '29', '0', '2025-07-16 09:49:07.224016');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('137', '48', '33', '0', '2025-07-16 13:23:07.060246');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('138', '61', '43', '0', '2025-07-24 07:23:14.012108');
INSERT INTO mold_mapping_items (id, mapping_id, mold_id, order_index, created_at) VALUES ('139', '59', '41', '0', '2025-10-20 09:45:15.753823');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('41', 'INNATO E4', 'INNATO', 'E4', 't', '2025-05-15 05:19:15.228433', '2025-05-15 05:19:15.228433');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('42', 'INNATO D#4', 'INNATO', 'D#4', 't', '2025-05-15 05:19:25.472566', '2025-05-15 05:19:25.472566');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('43', 'INNATO D4', 'INNATO', 'D4', 't', '2025-05-15 05:19:30.384956', '2025-05-15 05:19:30.384956');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('44', 'INNATO C#4', 'INNATO', 'C#4', 't', '2025-05-15 05:19:35.546343', '2025-05-15 05:19:35.546343');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('45', 'INNATO C4', 'INNATO', 'C4', 't', '2025-05-15 05:19:41.302003', '2025-05-15 05:19:41.302003');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('46', 'INNATO B3', 'INNATO', 'B3', 't', '2025-05-15 05:19:44.369695', '2025-05-15 05:19:44.369695');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('47', 'INNATO Bb3', 'INNATO', 'Bb3', 't', '2025-05-15 05:19:48.374373', '2025-05-15 05:19:48.374373');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('48', 'INNATO A3', 'INNATO', 'A3', 't', '2025-05-15 05:19:53.523934', '2025-05-15 05:19:53.523934');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('49', 'INNATO G#3', 'INNATO', 'G#3', 't', '2025-05-15 05:20:00.345645', '2025-05-15 05:20:00.345645');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('50', 'INNATO G3', 'INNATO', 'G3', 't', '2025-05-15 05:20:04.661143', '2025-05-15 05:20:04.661143');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('51', 'INNATO F#3', 'INNATO', 'F#3', 't', '2025-05-15 05:20:10.532427', '2025-05-15 05:20:10.532427');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('52', 'INNATO F3', 'INNATO', 'F3', 't', '2025-05-15 05:20:14.82004', '2025-05-15 05:20:14.82004');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('53', 'INNATO E3', 'INNATO', 'E3', 't', '2025-05-15 05:20:21.09671', '2025-05-15 05:20:21.09671');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('54', 'NATEY A4', 'NATEY', 'A4', 't', '2025-05-15 05:23:29.200047', '2025-05-15 05:23:29.200047');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('55', 'NATEY G#4', 'NATEY', 'G#4', 't', '2025-05-15 05:23:35.126753', '2025-05-15 05:23:35.126753');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('56', 'NATEY G4', 'NATEY', 'G4', 't', '2025-05-15 05:23:39.798978', '2025-05-15 05:23:39.798978');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('57', 'NATEY F#4', 'NATEY', 'F#4', 't', '2025-05-15 05:23:47.30694', '2025-05-15 05:23:47.30694');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('58', 'NATEY F4', 'NATEY', 'F4', 't', '2025-05-15 05:23:53.901481', '2025-05-15 05:23:53.901481');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('59', 'NATEY E4', 'NATEY', 'E4', 't', '2025-05-15 05:24:00.442457', '2025-05-15 05:24:00.442457');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('60', 'NATEY D#4', 'NATEY', 'D#4', 't', '2025-05-15 05:24:07.626634', '2025-05-15 05:24:07.626634');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('61', 'NATEY D4', 'NATEY', 'D4', 't', '2025-05-15 05:24:12.830242', '2025-05-15 05:24:12.830242');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('62', 'NATEY C#4', 'NATEY', 'C#4', 't', '2025-05-15 05:24:17.999465', '2025-05-15 05:24:17.999465');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('63', 'NATEY C4', 'NATEY', 'C4', 't', '2025-05-15 05:24:22.325428', '2025-05-15 05:24:22.325428');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('64', 'NATEY B3', 'NATEY', 'B3', 't', '2025-05-15 05:24:31.841905', '2025-05-15 05:24:31.841905');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('65', 'NATEY Bb3', 'NATEY', 'Bb3', 't', '2025-05-15 05:24:40.244174', '2025-05-15 05:24:40.244174');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('66', 'NATEY A3', 'NATEY', 'A3', 't', '2025-05-15 05:24:46.319041', '2025-05-15 05:24:46.319041');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('67', 'NATEY G#3', 'NATEY', 'G#3', 't', '2025-05-15 05:24:53.158077', '2025-05-15 05:24:53.158077');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('68', 'NATEY G3', 'NATEY', 'G3', 't', '2025-05-15 05:25:02.244047', '2025-05-15 05:25:02.244047');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('69', 'ZEN M', 'ZEN', 'M', 't', '2025-05-15 05:34:39.619807', '2025-05-15 05:34:39.619807');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('70', 'ZEN L', 'ZEN', 'L', 't', '2025-05-15 05:34:48.06018', '2025-05-15 05:34:48.06018');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('71', 'DOUBLE C#4', 'DOUBLE', 'C#4', 't', '2025-05-15 05:35:07.157384', '2025-05-15 05:35:07.157384');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('72', 'DOUBLE C4', 'DOUBLE', 'C4', 't', '2025-05-15 05:35:16.900498', '2025-05-15 05:35:16.900498');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('73', 'DOUBLE B3', 'DOUBLE', 'B3', 't', '2025-05-15 05:35:21.72445', '2025-05-15 05:35:21.72445');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('74', 'DOUBLE Bb3', 'DOUBLE', 'Bb3', 't', '2025-05-15 05:35:26.342324', '2025-05-15 05:35:26.342324');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('75', 'DOUBLE A3', 'DOUBLE', 'A3', 't', '2025-05-15 05:35:34.390773', '2025-05-15 05:35:34.390773');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('76', 'DOUBLE G#3', 'DOUBLE', 'G#3', 't', '2025-05-15 05:35:42.37711', '2025-05-15 05:35:42.37711');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('77', 'DOUBLE G3', 'DOUBLE', 'G3', 't', '2025-05-15 05:35:48.719893', '2025-05-15 05:35:48.719893');
INSERT INTO mold_mappings (id, name, instrument_type, tuning_note, is_active, created_at, updated_at) VALUES ('78', 'OvA 64 Hz', 'OvA', '64 Hz', 't', '2025-05-15 05:37:59.186587', '2025-05-15 05:37:59.186587');
INSERT INTO production_notes (id, order_id, item_id, note, created_by, source, created_at) VALUES ('1', '1', '1', 'Order validated and materials reserved', 'system', 'internal', '2025-05-02 10:30:00');
INSERT INTO production_notes (id, order_id, item_id, note, created_by, source, created_at) VALUES ('2', '1', '1', 'Started building process for Innato A3', 'Marco', 'internal', '2025-05-03 14:45:00');
INSERT INTO session (sid, sess, expire) VALUES ('KhQDKWFNtCcEaC4-G3djitcbUfYhN44c', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-12T11:40:05.269Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-19 15:10:31');
INSERT INTO session (sid, sess, expire) VALUES ('y_HX-KGHyhgx2WJJGBAItye3OHmBNPEF', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-10-27T09:55:36.810Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-19 15:10:56');
INSERT INTO session (sid, sess, expire) VALUES ('Exp7QE917BTYwJPHmBBJRwQxq7pO4MYB', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-09T08:09:23.978Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-19 12:29:20');
INSERT INTO session (sid, sess, expire) VALUES ('c7cTSEy_XZZ93ZpaHalPtgA0hJngmae3', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-10-07T21:24:22.644Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-06 19:15:14');
INSERT INTO session (sid, sess, expire) VALUES ('Mz4INuTdb72uIMtqbn7RlbDmR_md6xsM', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-11-06T07:01:31.131Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-06 07:03:40');
INSERT INTO session (sid, sess, expire) VALUES ('yRYFjBVzQ7DRaGoFfdQQ4nmEFx6UCKe5', '{"cookie":{"originalMaxAge":2592000000,"expires":"2025-10-11T12:35:02.639Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":4}}', '2025-11-08 14:51:09');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('16', '17', '[1]', '[{"shopifyLineItemId":"16574528029003","suffix":1,"title":"Innato Dm4"}]', '2025-05-13 14:49:23.105', '2025-07-04 11:47:50.861');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('328', '333', '[1]', '[{"shopifyLineItemId":"16538871071051","suffix":1,"title":"Innato Em4"}]', '2025-05-13 14:57:00.798', '2025-05-17 07:45:06.496');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('377', '382', '[1]', '[{"shopifyLineItemId":"16841887646027","suffix":1,"title":"Innato Am3"}]', '2025-06-24 08:26:39.67', '2025-08-07 12:10:34.844');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('2', '3', '[1]', '[{"shopifyLineItemId":"16665201705291","suffix":1,"title":"Natey Am4"}]', '2025-05-13 14:49:20.181', '2025-07-11 07:17:10.961');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('371', '376', '[1]', '[{"shopifyLineItemId":"16798170939723","suffix":1,"title":"Innato Bbm3"}]', '2025-06-14 13:10:08.635', '2025-07-15 11:15:09.397');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('330', '335', '[1]', '[{"shopifyLineItemId":"16535593353547","suffix":1,"title":"Natey Dm4"}]', '2025-05-13 14:57:01.102', '2025-05-17 07:45:06.771');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('322', '327', '[1]', '[{"shopifyLineItemId":"16569193529675","suffix":1,"title":"ZEN flute Medium"}]', '2025-05-13 14:56:59.854', '2025-07-04 11:47:51.274');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('11', '12', '[1]', '[{"shopifyLineItemId":"16604072411467","suffix":1,"title":"ZEN flute Large"}]', '2025-05-13 14:49:22.188', '2025-07-04 11:47:48.731');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('332', '337', '[1]', '[{"shopifyLineItemId":"16503235281227","suffix":1,"title":"Innato Em4"}]', '2025-05-13 14:57:01.394', '2025-09-22 08:49:37.205');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('434', '439', '[1,2]', '[{"shopifyLineItemId":"34949919670603","suffix":1,"title":"Innato C#m4"},{"shopifyLineItemId":"34950632866123","suffix":2,"title":"Innato C#m4"}]', '2025-10-05 10:13:12.914', '2025-10-20 15:10:56.448');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('326', '331', '[1]', '[{"shopifyLineItemId":"16560707633483","suffix":1,"title":"Innato Bbm3"}]', '2025-05-13 14:57:00.498', '2025-06-08 07:58:44.847');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('327', '332', '[1]', '[{"shopifyLineItemId":"16550977012043","suffix":1,"title":"Innato C#m4"}]', '2025-05-13 14:57:00.644', '2025-06-08 07:58:45.254');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('334', '339', '[1]', '[{"shopifyLineItemId":"16494827569483","suffix":1,"title":"Innato Dm4"}]', '2025-05-13 14:57:01.724', '2025-05-17 07:45:07.309');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('329', '334', '[1]', '[{"shopifyLineItemId":"16537558319435","suffix":1,"title":"Natey Am4"}]', '2025-05-13 14:57:00.953', '2025-06-08 07:58:45.842');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('325', '330', '[1,2]', '[{"shopifyLineItemId":"16563508445515","suffix":1,"title":"Innato Cm4"},{"shopifyLineItemId":"16563508478283","suffix":2,"title":"Innato Fm3"}]', '2025-05-13 14:57:00.354', '2025-07-15 11:49:52.104');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('402', '407', '[1]', '[{"shopifyLineItemId":"17014354018635","suffix":1,"title":"Innato Exploration Cards"}]', '2025-08-04 13:35:24.532', '2025-08-07 14:58:41.031');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('9', '10', '[1]', '[{"shopifyLineItemId":"16634801291595","suffix":1,"title":"Innato Gm3"}]', '2025-05-13 14:49:21.848', '2025-07-09 14:28:23.93');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('5', '6', '[1]', '[{"shopifyLineItemId":"16652674072907","suffix":1,"title":"Innato Fm3"}]', '2025-05-13 14:49:20.7', '2025-08-07 12:10:45.116');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('7', '8', '[1]', '[{"shopifyLineItemId":"16643297050955","suffix":1,"title":"Natey G#m4"}]', '2025-05-13 14:49:21.065', '2025-07-15 11:15:20.443');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('14', '15', '[1]', '[{"shopifyLineItemId":"16590322794827","suffix":1,"title":"Natey G#m4"}]', '2025-05-13 14:49:22.74', '2025-07-15 11:15:22.553');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('6', '7', '[1]', '[{"shopifyLineItemId":"16646644695371","suffix":1,"title":"Natey Cm4"}]', '2025-05-13 14:49:20.875', '2025-07-11 07:17:12.675');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('412', '417', '[1]', '[{"shopifyLineItemId":"17128124088651","suffix":1,"title":"Natey G#m4"}]', '2025-08-27 21:01:31.868', '2025-10-20 12:28:54.457');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('333', '338', '[1]', '[{"shopifyLineItemId":"16496935403851","suffix":1,"title":"Natey Cm4"}]', '2025-05-13 14:57:01.551', '2025-06-08 07:58:47.171');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('375', '380', '[1]', '[{"shopifyLineItemId":"16832163578187","suffix":1,"title":"Innato Dm4"}]', '2025-06-21 12:34:59.373', '2025-08-07 12:10:36.079');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('324', '329', '[1]', '[{"shopifyLineItemId":"16565900673355","suffix":1,"title":"Natey Gm3"}]', '2025-05-13 14:57:00.152', '2025-07-15 11:15:23.793');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('336', '341', '[1]', '[{"shopifyLineItemId":"16492498616651","suffix":1,"title":"Innato Cm4"}]', '2025-05-13 14:57:02.173', '2025-05-17 07:45:07.578');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('337', '342', '[1]', '[{"shopifyLineItemId":"16489221980491","suffix":1,"title":"Natey Am4"}]', '2025-05-13 14:57:02.333', '2025-05-17 07:45:07.717');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('338', '343', '[1]', '[{"shopifyLineItemId":"16486560072011","suffix":1,"title":"Natey Am3"}]', '2025-05-13 14:57:02.479', '2025-05-17 07:45:07.855');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('339', '344', '[1]', '[{"shopifyLineItemId":"16484188782923","suffix":1,"title":"Natey G#m4"}]', '2025-05-13 14:57:02.625', '2025-05-17 07:45:07.994');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('340', '345', '[1]', '[{"shopifyLineItemId":"16483698901323","suffix":1,"title":"Innato Em4"}]', '2025-05-13 14:57:02.772', '2025-05-17 07:45:08.13');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('354', '359', '[1]', '[{"shopifyLineItemId":"16694270427467","suffix":1,"title":"Innato Dm4"}]', '2025-05-21 13:28:27.479', '2025-07-15 11:15:16.202');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('12', '13', '[1]', '[{"shopifyLineItemId":"16601674613067","suffix":1,"title":"Innato Em4"}]', '2025-05-13 14:49:22.377', '2025-07-04 11:47:49.151');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('410', '415', '[1]', '[{"shopifyLineItemId":"17102782890315","suffix":1,"title":"Innato Bbm3"}]', '2025-08-21 07:24:42.511', '2025-09-29 07:45:22.822');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('430', '435', '[1]', '[{"shopifyLineItemId":"34905913262411","suffix":1,"title":"Innato Am3"}]', '2025-09-29 07:33:18.517', '2025-10-20 12:28:48.143');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('369', '374', '[1]', '[{"shopifyLineItemId":"16789943058763","suffix":1,"title":"Innato Bbm3"}]', '2025-06-13 18:38:15.514', '2025-08-07 12:10:38.252');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('406', '411', '[1]', '[{"shopifyLineItemId":"17083072577867","suffix":1,"title":"Innato C#m4"}]', '2025-08-18 07:09:49.624', '2025-10-20 12:28:56.252');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('15', '16', '[1]', '[{"shopifyLineItemId":"16587053236555","suffix":1,"title":"ZEN flute Medium"}]', '2025-05-13 14:49:22.943', '2025-07-04 15:08:23.558');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('331', '336', '[1]', '[{"shopifyLineItemId":"16509335044427","suffix":1,"title":"Innato Bm3"}]', '2025-05-13 14:57:01.25', '2025-07-04 15:02:51.17');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('1', '2', '[1]', '[{"shopifyLineItemId":"16667050344779","suffix":1,"title":"Natey F#m4"}]', '2025-05-13 14:49:20.008', '2025-07-15 11:15:18.314');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('407', '412', '[1]', '[{"shopifyLineItemId":"17081519341899","suffix":1,"title":"Innato Am3"}]', '2025-08-18 07:09:49.987', '2025-09-29 07:45:24.07');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('3', '4', '[1]', '[{"shopifyLineItemId":"16661413200203","suffix":1,"title":"Natey Am4"}]', '2025-05-13 14:49:20.359', '2025-07-15 11:15:18.946');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('4', '5', '[1]', '[{"shopifyLineItemId":"16655963980107","suffix":1,"title":"Innato Gm3"}]', '2025-05-13 14:49:20.52', '2025-07-15 11:15:19.375');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('323', '328', '[1]', '[{"shopifyLineItemId":"16568669241675","suffix":1,"title":"Innato Exploration Cards"}]', '2025-05-13 14:57:00.005', '2025-07-13 19:27:08.391');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('335', '340', '[1]', '[{"shopifyLineItemId":"16494657077579","suffix":1,"title":"Innato Dm4"}]', '2025-05-13 14:57:01.898', '2025-09-16 08:40:57.621');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('378', '383', '[1]', '[{"shopifyLineItemId":"16840737751371","suffix":1,"title":"Innato Bbm3"}]', '2025-06-24 08:26:40.143', '2025-08-07 12:10:35.259');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('13', '14', '[1]', '[{"shopifyLineItemId":"16590850326859","suffix":1,"title":"Natey Dm4"}]', '2025-05-13 14:49:22.562', '2025-07-04 15:02:47.09');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('368', '373', '[1]', '[{"shopifyLineItemId":"16794782007627","suffix":1,"title":"Innato Dm4"}]', '2025-06-13 18:38:15.361', '2025-08-07 12:10:37.593');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('370', '375', '[1]', '[{"shopifyLineItemId":"16788418462027","suffix":1,"title":"Innato Am3"}]', '2025-06-13 18:38:15.652', '2025-08-07 12:10:38.663');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('432', '437', '[1]', '[{"shopifyLineItemId":"34929128669515","suffix":1,"title":"Innato Bbm3"}]', '2025-10-02 07:19:13.793', '2025-10-20 12:28:47.734');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('382', '387', '[1]', '[{"shopifyLineItemId":"16853787050315","suffix":1,"title":"Innato G#m3"}]', '2025-06-27 15:12:50.12', '2025-10-20 12:29:02.488');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('413', '418', '[1]', '[{"shopifyLineItemId":"17106822857035","suffix":1,"title":"Natey F#m4"}]', '2025-08-27 21:01:32.219', '2025-10-20 12:28:54.86');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('429', '434', '[1]', '[{"shopifyLineItemId":"34896422437195","suffix":1,"title":"Innato Am3"}]', '2025-09-26 17:23:09.489', '2025-10-20 12:28:48.547');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('411', '416', '[1]', '[{"shopifyLineItemId":"17090867560779","suffix":1,"title":"Natey Dm4"}]', '2025-08-21 07:24:42.892', '2025-10-20 12:28:55.848');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('383', '388', '[1]', '[{"shopifyLineItemId":"16852999209291","suffix":1,"title":"Innato G#m3"}]', '2025-06-27 15:12:50.516', '2025-10-20 12:29:02.888');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('350', '355', '[1]', '[{"shopifyLineItemId":"16304363110731","suffix":1,"title":"Innato Exploration Cards"}]', '2025-05-13 14:57:04.966', '2025-05-13 14:57:04.966');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('361', '366', '[1]', '[{"shopifyLineItemId":"16723463799115","suffix":1,"title":"Innato D#m4"}]', '2025-05-30 05:39:11.399', '2025-08-07 12:10:40.86');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('362', '367', '[1]', '[{"shopifyLineItemId":"16723416383819","suffix":1,"title":"Innato Dm4"}]', '2025-05-30 05:39:11.779', '2025-08-07 12:10:41.275');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('352', '357', '[1]', '[{"shopifyLineItemId":"16251654799691","suffix":1,"title":"Double Medium Native Bbm3"}]', '2025-05-13 15:18:48.603', '2025-07-08 13:11:25.006');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('414', '419', '[1,2,3]', '[{"shopifyLineItemId":"34749211214155","suffix":1,"title":"Innato C#m4"},{"shopifyLineItemId":"34749211246923","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"34749211279691","suffix":3,"title":"Innato Dm4"}]', '2025-09-02 05:51:07.302', '2025-09-29 07:45:20.763');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('415', '420', '[1]', '[{"shopifyLineItemId":"34749165797707","suffix":1,"title":"Innato Em4"}]', '2025-09-02 05:51:07.669', '2025-09-29 07:45:21.269');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('10', '11', '[1]', '[{"shopifyLineItemId":"16626680430923","suffix":1,"title":"Innato Bm3"}]', '2025-05-13 14:49:22.026', '2025-07-04 15:02:46.273');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('380', '385', '[1]', '[{"shopifyLineItemId":"16843095572811","suffix":1,"title":"Innato Bm3"}]', '2025-06-24 17:09:50.917', '2025-08-07 12:10:33.688');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('364', '369', '[1]', '[{"shopifyLineItemId":"16739224912203","suffix":1,"title":"Innato Am3"}]', '2025-06-03 07:21:52.533', '2025-08-12 06:29:04.833');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('376', '381', '[1]', '[{"shopifyLineItemId":"16832614039883","suffix":1,"title":"Innato Am3"}]', '2025-06-21 21:39:26.078', '2025-08-07 12:10:35.664');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('342', '347', '[1]', '[{"shopifyLineItemId":"16479462719819","suffix":1,"title":"Innato Bm3"}]', '2025-05-13 14:57:03.091', '2025-05-17 07:45:08.426');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('365', '370', '[1]', '[{"shopifyLineItemId":"16754237145419","suffix":1,"title":"Innato Am3"}]', '2025-06-05 05:07:50.21', '2025-08-07 12:10:39.809');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('363', '368', '[1]', '[{"shopifyLineItemId":"16721416552779","suffix":1,"title":"Natey Cm4"}]', '2025-05-30 05:39:12.157', '2025-07-15 11:15:13.754');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('359', '364', '[1,2]', '[{"shopifyLineItemId":"16711286489419","suffix":1,"title":"Natey C#m4"},{"shopifyLineItemId":"16711286522187","suffix":2,"title":"Natey G#m4"}]', '2025-05-26 06:49:04.911', '2025-07-15 11:15:14.195');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('346', '351', '[1]', '[{"shopifyLineItemId":"16451904012619","suffix":1,"title":"Natey Gm3"}]', '2025-05-13 14:57:03.97', '2025-05-17 07:45:08.998');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('347', '352', '[1]', '[{"shopifyLineItemId":"16396443451723","suffix":1,"title":"Innato Am3"}]', '2025-05-13 14:57:04.219', '2025-05-17 07:45:09.196');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('404', '409', '[1]', '[{"shopifyLineItemId":"17049182208331","suffix":1,"title":"Natey Fm4"}]', '2025-08-11 21:25:35.169', '2025-09-29 07:45:25.384');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('345', '350', '[1]', '[{"shopifyLineItemId":"16465822089547","suffix":1,"title":"Innato Am3"}]', '2025-05-13 14:57:03.768', '2025-07-04 15:02:55.612');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('360', '365', '[1]', '[{"shopifyLineItemId":"16724780450123","suffix":1,"title":"Innato Cm4"}]', '2025-05-30 05:39:11.009', '2025-08-07 12:10:40.449');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('379', '384', '[1,2,3,4,5,6,7,8,9,10]', '[{"shopifyLineItemId":"16842507157835","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16842507190603","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16842507223371","suffix":3,"title":"Innato Bbm3"},{"shopifyLineItemId":"16842507256139","suffix":4,"title":"Innato Bbm3"},{"shopifyLineItemId":"16842507288907","suffix":5,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507321675","suffix":6,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507354443","suffix":7,"title":"Innato Cm4"},{"shopifyLineItemId":"16842507387211","suffix":8,"title":"Innato Dm4"},{"shopifyLineItemId":"16842507419979","suffix":9,"title":"Innato Bm3"},{"shopifyLineItemId":"16919344120139","suffix":10,"title":"Innato Dm4"}]', '2025-06-24 10:49:28.668', '2025-08-14 14:40:30.127');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('357', '362', '[1]', '[{"shopifyLineItemId":"16707772252491","suffix":1,"title":"Innato Em4"}]', '2025-05-25 10:30:41.61', '2025-07-15 11:15:14.67');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('358', '363', '[1,2]', '[{"shopifyLineItemId":"16707676078411","suffix":1,"title":"Innato Exploration Cards"},{"shopifyLineItemId":"16707676111179","suffix":2,"title":"ZEN flute Large"}]', '2025-05-25 10:30:42.094', '2025-07-15 11:15:15.099');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('356', '361', '[1]', '[{"shopifyLineItemId":"16705063846219","suffix":1,"title":"Natey F#m4"}]', '2025-05-24 14:29:45.098', '2025-07-11 07:17:07.716');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('348', '353', '[1]', '[{"shopifyLineItemId":"16391832273227","suffix":1,"title":"Innato Em3 (NEW)"}]', '2025-05-13 14:57:04.402', '2025-06-08 07:58:51.785');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('349', '354', '[1]', '[{"shopifyLineItemId":"16317989617995","suffix":1,"title":"Innato Am3"}]', '2025-05-13 14:57:04.797', '2025-06-08 07:58:52.556');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('355', '360', '[1]', '[{"shopifyLineItemId":"16703125946699","suffix":1,"title":"Innato Am3"}]', '2025-05-24 04:03:01.644', '2025-07-15 11:15:15.775');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('351', '356', '[1]', '[{"shopifyLineItemId":"16260633428299","suffix":1,"title":"Double Large Native Am3"}]', '2025-05-13 14:57:05.403', '2025-07-11 18:32:50.753');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('343', '348', '[1,2,3,4]', '[{"shopifyLineItemId":"16479417991499","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479418024267","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479418057035","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479418089803","suffix":4,"title":"Innato G#m3"}]', '2025-05-13 14:57:03.345', '2025-07-10 08:33:00.834');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('344', '349', '[1,2,3,4]', '[{"shopifyLineItemId":"16479365464395","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16479365497163","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16479365529931","suffix":3,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"16479365562699","suffix":4,"title":"Innato G#m3"}]', '2025-05-13 14:57:03.6', '2025-07-10 08:33:01.297');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('403', '408', '[1]', '[{"shopifyLineItemId":"17028934926667","suffix":1,"title":"Innato C#m4"}]', '2025-08-07 07:49:40.648', '2025-09-29 07:45:25.801');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('433', '438', '[1,2,3]', '[{"shopifyLineItemId":"34933493858635","suffix":1,"title":"OvA flute C2 64 Hz"},{"shopifyLineItemId":"34933493891403","suffix":2,"title":"Innato Em3 (NEW)"},{"shopifyLineItemId":"34933493924171","suffix":3,"title":"Natey Am3"}]', '2025-10-02 07:56:00.814', '2025-10-20 12:28:46.794');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('341', '346', '[1]', '[{"shopifyLineItemId":"16483464118603","suffix":1,"title":"Innato Cm4"}]', '2025-05-13 14:57:02.924', '2025-09-16 08:40:59.039');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('381', '386', '[1,2]', '[{"shopifyLineItemId":"16849088282955","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16849088315723","suffix":2,"title":"Natey Dm4"}]', '2025-06-26 05:58:50.57', '2025-09-26 17:23:29.511');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('408', '413', '[1]', '[{"shopifyLineItemId":"17079138484555","suffix":1,"title":"ZEN flute Medium"}]', '2025-08-18 07:09:50.367', '2025-09-29 07:45:24.509');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('405', '410', '[1,2,3,4]', '[{"shopifyLineItemId":"17056603439435","suffix":1,"title":"Double Large Native Gm3"},{"shopifyLineItemId":"17056603472203","suffix":2,"title":"Innato Gm3"},{"shopifyLineItemId":"17056603504971","suffix":3,"title":"Natey Am3"},{"shopifyLineItemId":"17056603537739","suffix":4,"title":"Natey Am3"}]', '2025-08-12 06:52:44.371', '2025-09-29 07:45:24.832');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('436', '441', '[1]', '[{"shopifyLineItemId":"34949043650891","suffix":1,"title":"Natey Am3"}]', '2025-10-05 10:13:13.673', '2025-10-20 12:28:46.39');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('397', '402', '[1]', '[{"shopifyLineItemId":"16938621698379","suffix":1,"title":"Innato Em4"}]', '2025-07-20 08:55:06.589', '2025-09-29 07:45:28.086');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('393', '398', '[1]', '[{"shopifyLineItemId":"16916108443979","suffix":1,"title":"ZEN flute Medium"}]', '2025-07-13 16:29:32.377', '2025-09-29 07:45:30.27');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('435', '440', '[1]', '[{"shopifyLineItemId":"34949240226123","suffix":1,"title":"Innato Cm4"}]', '2025-10-05 10:13:13.299', '2025-10-20 15:10:56.902');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('409', '414', '[1]', '[{"shopifyLineItemId":"17102883193163","suffix":1,"title":"Innato Cm4"}]', '2025-08-21 07:24:42.171', '2025-10-20 12:28:55.263');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('396', '401', '[1]', '[{"shopifyLineItemId":"16930952216907","suffix":1,"title":"Innato Em4"}]', '2025-07-17 14:10:01.632', '2025-10-20 12:28:58.785');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('8', '9', '[1,2,3,4,5,6,7,8,9,10,11,12]', '[{"shopifyLineItemId":"16637598400843","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16637598433611","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16637598466379","suffix":3,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598499147","suffix":4,"title":"Innato Bbm3"},{"shopifyLineItemId":"16637598531915","suffix":5,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598564683","suffix":6,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598597451","suffix":7,"title":"Innato Bm3"},{"shopifyLineItemId":"16637598630219","suffix":8,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598662987","suffix":9,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598695755","suffix":10,"title":"Innato Cm4"},{"shopifyLineItemId":"16637598728523","suffix":11,"title":"Innato Dm4"},{"shopifyLineItemId":"16637598761291","suffix":12,"title":"Innato Em4"}]', '2025-05-13 14:49:21.681', '2025-06-08 07:58:38.819');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('427', '432', '[1]', '[{"shopifyLineItemId":"34871227810123","suffix":1,"title":"Innato C#m4"}]', '2025-09-24 03:30:30.059', '2025-10-20 12:28:49.757');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('424', '429', '[1]', '[{"shopifyLineItemId":"34843581153611","suffix":1,"title":"Natey Am3"}]', '2025-09-22 07:47:50.015', '2025-10-20 12:28:50.156');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('425', '430', '[1]', '[{"shopifyLineItemId":"34830731510091","suffix":1,"title":"Innato Fm3"}]', '2025-09-22 07:47:50.416', '2025-10-20 12:28:50.566');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('353', '358', '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]', '[{"shopifyLineItemId":"16691001557323","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"16691001590091","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"16691001622859","suffix":3,"title":"Innato Bm3"},{"shopifyLineItemId":"16691001655627","suffix":4,"title":"Innato Bm3"},{"shopifyLineItemId":"16691001688395","suffix":5,"title":"Innato Cm4"},{"shopifyLineItemId":"16691001721163","suffix":6,"title":"Innato Cm4"},{"shopifyLineItemId":"16691001753931","suffix":7,"title":"Innato Dm4"},{"shopifyLineItemId":"16691001786699","suffix":8,"title":"Innato Dm4"},{"shopifyLineItemId":"16691001819467","suffix":9,"title":"Innato Gm3"},{"shopifyLineItemId":"16691001852235","suffix":10,"title":"Innato Gm3"},{"shopifyLineItemId":"16691001885003","suffix":11,"title":"Natey Bbm3"},{"shopifyLineItemId":"16691001917771","suffix":12,"title":"Natey Bbm3"},{"shopifyLineItemId":"16691001950539","suffix":13,"title":"Natey Em3"},{"shopifyLineItemId":"16691001983307","suffix":14,"title":"Natey Em3"},{"shopifyLineItemId":"16691002016075","suffix":15,"title":"Natey Fm4"},{"shopifyLineItemId":"16691002048843","suffix":16,"title":"Natey Fm4"},{"shopifyLineItemId":"16691002081611","suffix":17,"title":"Natey Gm3"},{"shopifyLineItemId":"16691002114379","suffix":18,"title":"Natey Gm3"},{"shopifyLineItemId":"16694322594123","suffix":19,"title":"Double Large Native Am3"},{"shopifyLineItemId":"16694322626891","suffix":20,"title":"Double Medium Native Cm4"},{"shopifyLineItemId":"16694322659659","suffix":21,"title":"Double Large Native Gm3"},{"shopifyLineItemId":"16694322659659","suffix":22,"title":"Double Large Native Gm3"},{"shopifyLineItemId":"16920727454027","suffix":23,"title":"Double Large Native Gm3"}]', '2025-05-21 07:08:04.729', '2025-07-15 12:06:29.957');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('373', '378', '[1]', '[{"shopifyLineItemId":"16807369670987","suffix":1,"title":"Innato Bbm3"}]', '2025-06-16 11:24:20.72', '2025-08-07 12:10:36.674');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('372', '377', '[1]', '[{"shopifyLineItemId":"16803239461195","suffix":1,"title":"Natey G#m4"}]', '2025-06-16 07:17:28.862', '2025-08-07 12:10:37.086');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('384', '389', '[1]', '[{"shopifyLineItemId":"16859124859211","suffix":1,"title":"Innato Bm3"}]', '2025-06-29 05:52:03.972', '2025-09-27 14:15:57.961');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('385', '390', '[1]', '[{"shopifyLineItemId":"16858190774603","suffix":1,"title":"Natey Gm3"}]', '2025-06-29 05:52:04.378', '2025-09-27 14:15:58.382');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('419', '424', '[1,2]', '[{"shopifyLineItemId":"34792219803979","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"34980759372107","suffix":2,"title":"Innato Am3"}]', '2025-09-11 09:14:37.022', '2025-10-20 12:28:52.578');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('418', '423', '[1]', '[{"shopifyLineItemId":"34787734290763","suffix":1,"title":"Natey Dm4"}]', '2025-09-09 11:36:55.263', '2025-10-20 12:28:53.021');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('374', '379', '[1]', '[{"shopifyLineItemId":"16825813991755","suffix":1,"title":"Natey Em4"}]', '2025-06-21 05:40:04.314', '2025-07-10 08:32:39.805');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('390', '395', '[1]', '[{"shopifyLineItemId":"16879116616011","suffix":1,"title":"Natey Am3"}]', '2025-07-03 17:54:39.539', '2025-07-04 11:47:26.773');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('417', '422', '[1]', '[{"shopifyLineItemId":"34774042706251","suffix":1,"title":"Natey Fm4"}]', '2025-09-07 21:24:24.08', '2025-10-20 12:28:53.42');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('416', '421', '[1]', '[{"shopifyLineItemId":"34753700528459","suffix":1,"title":"Innato Am3"}]', '2025-09-04 14:25:53.249', '2025-09-29 07:45:20.353');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('391', '396', '[1]', '[{"shopifyLineItemId":"16880193405259","suffix":1,"title":"Innato Dm4"}]', '2025-07-04 08:03:56.127', '2025-09-29 07:45:30.876');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('388', '393', '[1]', '[{"shopifyLineItemId":"16874946036043","suffix":1,"title":"ZEN flute Large"}]', '2025-07-02 19:46:13.974', '2025-09-29 07:45:31.477');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('387', '392', '[1]', '[{"shopifyLineItemId":"16868692328779","suffix":1,"title":"Double Medium Native Cm4"}]', '2025-07-01 17:54:25.222', '2025-10-20 12:29:01.548');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('431', '436', '[1,2]', '[{"shopifyLineItemId":"34929315873099","suffix":1,"title":"Natey F#m4"},{"shopifyLineItemId":"34929315905867","suffix":2,"title":"Innato Bm3"}]', '2025-10-02 07:19:13.424', '2025-10-20 12:28:47.286');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('423', '428', '[1]', '[{"shopifyLineItemId":"34823275544907","suffix":1,"title":"Innato Dm4"}]', '2025-09-16 08:40:26.212', '2025-10-20 12:28:50.97');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('389', '394', '[1]', '[{"shopifyLineItemId":"16874423025995","suffix":1,"title":"ZEN flute Medium"}]', '2025-07-02 19:46:14.361', '2025-09-29 07:45:31.893');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('428', '433', '[1]', '[{"shopifyLineItemId":"34878957879627","suffix":1,"title":"Innato Cm4"}]', '2025-09-24 15:18:27.959', '2025-10-20 12:28:48.95');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('421', '426', '[1]', '[{"shopifyLineItemId":"34813970809163","suffix":1,"title":"Innato Dm4"}]', '2025-09-15 10:06:09.383', '2025-10-20 12:28:51.374');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('438', '443', '[1]', '[{"shopifyLineItemId":"34992067543371","suffix":1,"title":"Natey Cm4"}]', '2025-10-13 11:38:45.105', '2025-10-20 15:10:53.786');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('386', '391', '[1]', '[{"shopifyLineItemId":"16863753634123","suffix":1,"title":"Innato Am3"}]', '2025-06-30 12:11:02.824', '2025-09-29 07:45:32.636');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('422', '427', '[1]', '[{"shopifyLineItemId":"34809554010443","suffix":1,"title":"Natey Am4"}]', '2025-09-15 10:06:09.778', '2025-10-20 12:28:51.776');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('426', '431', '[1]', '[{"shopifyLineItemId":"34873253560651","suffix":1,"title":"Natey Cm4"}]', '2025-09-24 03:30:29.674', '2025-10-20 12:28:49.352');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('420', '425', '[1]', '[{"shopifyLineItemId":"34803755352395","suffix":1,"title":"Innato Cm4"}]', '2025-09-13 06:39:29.357', '2025-10-20 12:28:52.176');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('401', '406', '[1]', '[{"shopifyLineItemId":"17000781840715","suffix":1,"title":"Innato Bm3"}]', '2025-08-01 20:46:50.27', '2025-09-29 07:45:26.414');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('400', '405', '[1]', '[{"shopifyLineItemId":"16993209647435","suffix":1,"title":"ZEN flute Large"}]', '2025-07-31 14:11:42.419', '2025-09-29 07:45:26.829');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('395', '400', '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]', '[{"shopifyLineItemId":"16926388191563","suffix":1,"title":"Natey Am4"},{"shopifyLineItemId":"16926388224331","suffix":2,"title":"Natey Am4"},{"shopifyLineItemId":"16926388257099","suffix":3,"title":"Natey Am4"},{"shopifyLineItemId":"16926388289867","suffix":4,"title":"Natey Bm3"},{"shopifyLineItemId":"16926388322635","suffix":5,"title":"Natey Bm3"},{"shopifyLineItemId":"16926388355403","suffix":6,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388388171","suffix":7,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388420939","suffix":8,"title":"Natey Cm4"},{"shopifyLineItemId":"16926388453707","suffix":9,"title":"Natey Dm4"},{"shopifyLineItemId":"16926388486475","suffix":10,"title":"Natey Dm4"},{"shopifyLineItemId":"16926388519243","suffix":11,"title":"Natey F#m4"},{"shopifyLineItemId":"16926388552011","suffix":12,"title":"Natey Fm4"},{"shopifyLineItemId":"16926388584779","suffix":13,"title":"Natey Fm4"},{"shopifyLineItemId":"16926388617547","suffix":14,"title":"Natey Gm4"},{"shopifyLineItemId":"16926388650315","suffix":15,"title":"Natey Gm4"},{"shopifyLineItemId":"16926388683083","suffix":16,"title":"Natey Gm4"}]', '2025-07-16 09:32:45.435', '2025-08-07 14:12:56.215');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('399', '404', '[1]', '[{"shopifyLineItemId":"16973040550219","suffix":1,"title":"Innato Dm4"}]', '2025-07-28 08:43:30.69', '2025-09-29 07:45:27.246');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('398', '403', '[1]', '[{"shopifyLineItemId":"16963607527755","suffix":1,"title":"Innato Cm4"}]', '2025-07-25 06:43:42.739', '2025-09-29 07:45:27.664');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('392', '397', '[1]', '[{"shopifyLineItemId":"16887815668043","suffix":1,"title":"Natey Am4"}]', '2025-07-06 09:14:14.603', '2025-08-07 12:10:28.913');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('394', '399', '[1]', '[{"shopifyLineItemId":"16924583297355","suffix":1,"title":"Natey Am4"}]', '2025-07-16 06:05:34.491', '2025-10-20 12:29:00.04');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('437', '442', '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42]', '[{"shopifyLineItemId":"34961697734987","suffix":1,"title":"Innato Am3"},{"shopifyLineItemId":"34961697767755","suffix":2,"title":"Innato Am3"},{"shopifyLineItemId":"34961697800523","suffix":3,"title":"Innato Am3"},{"shopifyLineItemId":"34961697833291","suffix":4,"title":"Innato Bm3"},{"shopifyLineItemId":"34961697866059","suffix":5,"title":"Innato Bm3"},{"shopifyLineItemId":"34961697898827","suffix":6,"title":"Innato Bm3"},{"shopifyLineItemId":"34961697931595","suffix":7,"title":"Natey Am3"},{"shopifyLineItemId":"34961697964363","suffix":8,"title":"Natey Am3"},{"shopifyLineItemId":"34961697997131","suffix":9,"title":"Natey Am3"},{"shopifyLineItemId":"34961698029899","suffix":10,"title":"Natey Am4"},{"shopifyLineItemId":"34961698062667","suffix":11,"title":"Natey Am4"},{"shopifyLineItemId":"34961698095435","suffix":12,"title":"Natey Am4"},{"shopifyLineItemId":"34961698128203","suffix":13,"title":"Natey Bm3"},{"shopifyLineItemId":"34961698160971","suffix":14,"title":"Natey Bm3"},{"shopifyLineItemId":"34961698193739","suffix":15,"title":"Natey Bm3"},{"shopifyLineItemId":"34961698226507","suffix":16,"title":"Natey Cm4"},{"shopifyLineItemId":"34961698259275","suffix":17,"title":"Natey Cm4"},{"shopifyLineItemId":"34961698292043","suffix":18,"title":"Natey Cm4"},{"shopifyLineItemId":"34961698324811","suffix":19,"title":"Natey Dm4"},{"shopifyLineItemId":"34961698357579","suffix":20,"title":"Natey Dm4"},{"shopifyLineItemId":"34961698390347","suffix":21,"title":"Natey Dm4"},{"shopifyLineItemId":"34961698423115","suffix":22,"title":"Natey Fm3"},{"shopifyLineItemId":"34961698455883","suffix":23,"title":"Natey Fm3"},{"shopifyLineItemId":"34961698488651","suffix":24,"title":"Natey Fm3"},{"shopifyLineItemId":"34961698521419","suffix":25,"title":"Natey Fm4"},{"shopifyLineItemId":"34961698554187","suffix":26,"title":"Natey Fm4"},{"shopifyLineItemId":"34961698586955","suffix":27,"title":"Natey Fm4"},{"shopifyLineItemId":"34961698619723","suffix":28,"title":"Natey Gm3"},{"shopifyLineItemId":"34961698652491","suffix":29,"title":"Natey Gm3"},{"shopifyLineItemId":"34961698685259","suffix":30,"title":"Natey Gm3"},{"shopifyLineItemId":"34961698718027","suffix":31,"title":"Innato Cm4"},{"shopifyLineItemId":"34961698750795","suffix":32,"title":"Innato Cm4"},{"shopifyLineItemId":"34961698783563","suffix":33,"title":"Innato Cm4"},{"shopifyLineItemId":"34961698816331","suffix":34,"title":"Innato Dm4"},{"shopifyLineItemId":"34961698849099","suffix":35,"title":"Innato Dm4"},{"shopifyLineItemId":"34961698881867","suffix":36,"title":"Innato Dm4"},{"shopifyLineItemId":"34961698914635","suffix":37,"title":"Innato Fm3"},{"shopifyLineItemId":"34961698947403","suffix":38,"title":"Innato Fm3"},{"shopifyLineItemId":"34961698980171","suffix":39,"title":"Innato Fm3"},{"shopifyLineItemId":"34961699012939","suffix":40,"title":"Innato Gm3"},{"shopifyLineItemId":"34961699045707","suffix":41,"title":"Innato Gm3"},{"shopifyLineItemId":"34961699078475","suffix":42,"title":"Innato Gm3"}]', '2025-10-07 10:36:30.107', '2025-10-20 15:10:54.114');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('366', '371', '[1]', '[{"shopifyLineItemId":"16757432910155","suffix":1,"title":"Double Large Native Gm3"}]', '2025-06-05 12:44:57.476', '2025-10-20 12:29:06.375');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('442', '447', '[1]', '[{"shopifyLineItemId":"35031261741387","suffix":1,"title":"Natey Em4"}]', '2025-10-20 06:15:00.805', '2025-10-20 15:10:51.695');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('443', '448', '[1]', '[{"shopifyLineItemId":"35030036808011","suffix":1,"title":"Innato Cm4"}]', '2025-10-20 06:15:00.945', '2025-10-20 15:10:52.111');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('441', '446', '[1]', '[{"shopifyLineItemId":"35024240673099","suffix":1,"title":"Innato Fm3"}]', '2025-10-19 08:26:00.185', '2025-10-20 15:10:52.524');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('440', '445', '[1]', '[{"shopifyLineItemId":"35005781639499","suffix":1,"title":"Innato Dm4"}]', '2025-10-16 06:09:13.674', '2025-10-20 15:10:52.946');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('439', '444', '[1]', '[{"shopifyLineItemId":"34994094965067","suffix":1,"title":"Natey Am3"}]', '2025-10-15 07:18:57.944', '2025-10-20 15:10:53.37');
INSERT INTO shopify_item_tracking (id, order_id, used_suffixes, item_mappings, created_at, updated_at) VALUES ('367', '372', '[1]', '[{"shopifyLineItemId":"16769546846539","suffix":1,"title":"Innato C#m4"}]', '2025-06-07 19:04:08.088', '2025-08-07 12:10:39.074');

INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@stonewhistle.com', '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0', 'admin');
