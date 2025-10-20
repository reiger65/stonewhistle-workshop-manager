// Script to run SQL queries directly to create the tables
import pkg from 'pg';
const { Pool } = pkg;

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Creating tables in PostgreSQL database...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        current_challenge TEXT,
        device_id TEXT,
        remember_token TEXT,
        last_login TIMESTAMP
      );
    `);
    console.log('Created users table');

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        shopify_order_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        customer_city TEXT,
        customer_state TEXT,
        customer_zip TEXT,
        customer_country TEXT,
        order_type TEXT NOT NULL,
        is_reseller BOOLEAN DEFAULT FALSE,
        reseller_nickname TEXT,
        status TEXT NOT NULL DEFAULT 'ordered',
        order_date TIMESTAMP NOT NULL DEFAULT NOW(),
        deadline TIMESTAMP,
        notes TEXT,
        progress INTEGER DEFAULT 0,
        specifications JSONB,
        status_change_dates JSONB DEFAULT '{}',
        build_date TIMESTAMP,
        archived BOOLEAN DEFAULT FALSE,
        tracking_number TEXT,
        tracking_company TEXT,
        tracking_url TEXT,
        shipped_date TIMESTAMP,
        estimated_delivery_date TIMESTAMP,
        delivery_status TEXT,
        delivered_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created orders table');

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        serial_number TEXT NOT NULL UNIQUE,
        item_type TEXT NOT NULL,
        item_size TEXT,
        tuning_type TEXT,
        color TEXT,
        weight TEXT,
        craftsperson TEXT,
        order_number TEXT,
        order_date TIMESTAMP,
        deadline TIMESTAMP,
        build_date TIMESTAMP,
        bag_size TEXT,
        box_size TEXT,
        specifications JSONB,
        status TEXT NOT NULL DEFAULT 'ordered',
        progress INTEGER DEFAULT 0,
        status_change_dates JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created order_items table');

    // Create production_notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_notes (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        item_id INTEGER,
        note TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created production_notes table');

    // Create materials_inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials_inventory (
        id SERIAL PRIMARY KEY,
        material_name TEXT NOT NULL,
        material_type TEXT NOT NULL,
        bag_type TEXT,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_point INTEGER DEFAULT 5,
        ordered INTEGER DEFAULT 0,
        expected_delivery TIMESTAMP,
        order_date TIMESTAMP,
        order_reference TEXT,
        display_order INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        notes TEXT
      );
    `);
    console.log('Created materials_inventory table');

    // Create instrument_inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS instrument_inventory (
        id SERIAL PRIMARY KEY,
        serial_number TEXT NOT NULL UNIQUE,
        instrument_type TEXT NOT NULL,
        tuning_type TEXT,
        color TEXT,
        date_produced TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'available',
        location TEXT,
        craftsperson TEXT,
        notes TEXT,
        price INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created instrument_inventory table');

    // Create material_mapping_rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS material_mapping_rules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        instrument_type TEXT NOT NULL,
        instrument_size TEXT,
        tuning_note TEXT,
        bag_type TEXT NOT NULL,
        bag_size TEXT NOT NULL,
        box_size TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created material_mapping_rules table');

    // Create mold_inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mold_inventory (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        size TEXT DEFAULT '',
        instrument_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created mold_inventory table');

    // Create mold_mappings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mold_mappings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        instrument_type TEXT NOT NULL,
        tuning_note TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created mold_mappings table');

    // Create mold_mapping_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mold_mapping_items (
        id SERIAL PRIMARY KEY,
        mapping_id INTEGER NOT NULL,
        mold_id INTEGER NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created mold_mapping_items table');

    // Create flute_settings table for tuner configurations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flute_settings (
        id SERIAL PRIMARY KEY,
        instrument_type TEXT NOT NULL,
        tuning_note TEXT NOT NULL,
        frequency INTEGER DEFAULT 440,
        description TEXT,
        sensitivity_threshold FLOAT DEFAULT 0.0001,
        adjusted_notes JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(instrument_type, tuning_note)
      );
    `);
    console.log('Created flute_settings table');

    console.log('All tables created successfully!');
    await pool.end();

  } catch (error) {
    console.error('Error creating tables:', error);
    await pool.end();
    process.exit(1);
  }
}

createTables();