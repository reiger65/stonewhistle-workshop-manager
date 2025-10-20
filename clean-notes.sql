-- Script om alle order notes leeg te maken
UPDATE orders
SET notes = ''
WHERE notes IS NOT NULL AND notes != '';