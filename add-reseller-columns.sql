-- Add reseller columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reseller_nickname TEXT;