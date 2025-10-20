-- Voeg archivering kolommen toe aan order_items tabel
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS archived_reason TEXT;