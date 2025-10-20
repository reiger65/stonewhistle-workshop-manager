-- Update mold names to include side information if needed
UPDATE mold_inventory
SET name = CONCAT(name, ' (', side, ')')
WHERE side NOT IN ('B', 'N/A');

-- Drop side column
ALTER TABLE mold_inventory
DROP COLUMN side;