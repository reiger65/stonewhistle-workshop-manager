-- Dit script markeert dubbele items in probleemorders als gearchiveerd
-- Het vindt eerst alle items met dezelfde shopify_line_item_id, maar behoudt het item
-- met het laagste serienummer (kleinste suffix) en markeert de rest als gearchiveerd.

-- Eerst vinden we de problematische orders
WITH problem_orders AS (
  SELECT id FROM orders WHERE order_number IN ('SW-1555', 'SW-1559', 'SW-1560', 'SW-1542')
),

-- Dan vinden we alle items voor deze orders
problem_items AS (
  SELECT * FROM order_items WHERE order_id IN (SELECT id FROM problem_orders)
),

-- Groepeer items op shopify_line_item_id
grouped_items AS (
  SELECT 
    shopify_line_item_id,
    MIN(id) AS keep_id
  FROM problem_items
  WHERE shopify_line_item_id IS NOT NULL
  GROUP BY shopify_line_item_id
  HAVING COUNT(*) > 1 -- Alleen groepen met duplicaten
)

-- Update items die gemarkeerd moeten worden als gearchiveerd
UPDATE order_items
SET 
  is_archived = true,
  status = 'archived',
  archived_reason = 'Automatisch gearchiveerd als duplicaat item (zelfde shopify line item ID)'
WHERE 
  id IN (
    SELECT pi.id
    FROM problem_items pi
    JOIN grouped_items gi ON pi.shopify_line_item_id = gi.shopify_line_item_id
    WHERE pi.id != gi.keep_id
  );