-- Check if location column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'mold_inventory' AND column_name = 'location'
  ) THEN
    -- Drop location column
    ALTER TABLE mold_inventory
    DROP COLUMN location;
    
    RAISE NOTICE 'Location column removed successfully.';
  ELSE
    RAISE NOTICE 'Location column does not exist - no migration needed.';
  END IF;
END $$;