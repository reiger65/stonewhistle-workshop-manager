-- Add Shopify line item ID column to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS shopify_line_item_id TEXT;

-- Create an index to optimize lookups by Shopify line item ID
CREATE INDEX IF NOT EXISTS idx_order_items_shopify_line_item_id
ON order_items (shopify_line_item_id);

-- Add comment to explain purpose of column
COMMENT ON COLUMN order_items.shopify_line_item_id IS 'Unieke Shopify line item ID voor permanente koppeling met serienummers';