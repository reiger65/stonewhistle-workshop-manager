-- Dit script controleert order 1555 en markeert items als gearchiveerd 
-- op basis van de shopify_line_item_id relatie

-- Eerst vinden we de specifieke order
WITH target_order AS (
  SELECT id FROM orders WHERE order_number = 'SW-1555'
),

-- Dan vinden we alle items voor deze order
order_items_all AS (
  SELECT * FROM order_items WHERE order_id IN (SELECT id FROM target_order)
),

-- Identificeer items met dezelfde shopify_line_item_id (duplicaten)
-- We willen per shopify_line_item_id slechts één actief item behouden
grouped_items AS (
  SELECT 
    shopify_line_item_id,
    MIN(id) AS keep_id -- behoud het item met de laagste ID
  FROM order_items_all
  WHERE shopify_line_item_id IS NOT NULL
  GROUP BY shopify_line_item_id
)

-- Update items die gemarkeerd moeten worden als gearchiveerd
-- Alleen items met dezelfde shopify_line_item_id waarvan er al één actief is
UPDATE order_items
SET 
  is_archived = true,
  status = 'archived',
  archived_reason = 'Automatisch gearchiveerd als duplicaat item voor order 1555'
WHERE 
  id IN (
    SELECT oia.id
    FROM order_items_all oia
    JOIN grouped_items gi ON oia.shopify_line_item_id = gi.shopify_line_item_id
    WHERE oia.id != gi.keep_id AND oia.is_archived = false
  );