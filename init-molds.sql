-- Initialize mold data for flute workshop management system
-- This script populates the mold_inventory, mold_mappings, and mold_mapping_items tables

-- Clear existing data first
DELETE FROM mold_mapping_items;
DELETE FROM mold_mappings;
DELETE FROM mold_inventory;

-- Reset sequences
ALTER SEQUENCE mold_inventory_id_seq RESTART WITH 1;
ALTER SEQUENCE mold_mappings_id_seq RESTART WITH 1;
ALTER SEQUENCE mold_mapping_items_id_seq RESTART WITH 1;

-- INNATO MOLDS
INSERT INTO mold_inventory (name, instrument_type, notes, is_active) VALUES 
('Innato Base', 'INNATO', 'Base mold for all Innato flutes', true),
('Innato Left Vessel', 'INNATO', 'Left vessel for Innato flutes - lowest notes', true),
('Innato Right Vessel', 'INNATO', 'Right vessel for Innato flutes - middle notes', true),
('Innato Front Vessel', 'INNATO', 'Front vessel for Innato flutes - highest notes', true);

-- NATEY MOLDS
INSERT INTO mold_inventory (name, instrument_type, notes, is_active) VALUES 
('Natey Base', 'NATEY', 'Base mold for all Natey flutes', true),
('Natey Vessel', 'NATEY', 'Single vessel for Natey flutes', true);

-- DOUBLE MOLDS
INSERT INTO mold_inventory (name, instrument_type, notes, is_active) VALUES 
('Double Base', 'DOUBLE', 'Base mold for all Double flutes', true),
('Double Chamber 1', 'DOUBLE', 'First chamber for Double flutes', true),
('Double Chamber 2', 'DOUBLE', 'Second chamber for Double flutes', true);

-- ZEN M MOLDS
INSERT INTO mold_inventory (name, instrument_type, notes, is_active) VALUES 
('ZEN M Base', 'ZEN_M', 'Base mold for ZEN M flutes', true),
('ZEN M Vessel', 'ZEN_M', 'Vessel mold for ZEN M flutes', true);

-- ZEN L MOLDS
INSERT INTO mold_inventory (name, instrument_type, notes, is_active) VALUES 
('ZEN L Base', 'ZEN_L', 'Base mold for ZEN L flutes', true),
('ZEN L Vessel', 'ZEN_L', 'Vessel mold for ZEN L flutes', true);

-- INNATO MAPPINGS FOR DIFFERENT KEYS
INSERT INTO mold_mappings (name, instrument_type, tuning_note, is_active) VALUES
('INNATO Cm4', 'INNATO', 'Cm4', true),
('INNATO D#m4', 'INNATO', 'D#m4', true),
('INNATO Dm4', 'INNATO', 'Dm4', true),
('INNATO C#m4', 'INNATO', 'C#m4', true),
('INNATO Em4', 'INNATO', 'Em4', true),
('INNATO Bm3', 'INNATO', 'Bm3', true),
('INNATO Bbm3', 'INNATO', 'Bbm3', true),
('INNATO Am3', 'INNATO', 'Am3', true),
('INNATO G#m3', 'INNATO', 'G#m3', true),
('INNATO Gm3', 'INNATO', 'Gm3', true),
('INNATO F#m3', 'INNATO', 'F#m3', true),
('INNATO Fm3', 'INNATO', 'Fm3', true),
('INNATO Em3', 'INNATO', 'Em3', true);

-- NATEY MAPPINGS FOR DIFFERENT KEYS
INSERT INTO mold_mappings (name, instrument_type, tuning_note, is_active) VALUES
('NATEY Am4', 'NATEY', 'Am4', true),
('NATEY G#m4', 'NATEY', 'G#m4', true),
('NATEY Gm4', 'NATEY', 'Gm4', true),
('NATEY F#m4', 'NATEY', 'F#m4', true),
('NATEY Fm4', 'NATEY', 'Fm4', true),
('NATEY Em4', 'NATEY', 'Em4', true),
('NATEY D#m4', 'NATEY', 'D#m4', true),
('NATEY Dm4', 'NATEY', 'Dm4', true),
('NATEY C#m4', 'NATEY', 'C#m4', true),
('NATEY Cm4', 'NATEY', 'Cm4', true),
('NATEY Bm3', 'NATEY', 'Bm3', true),
('NATEY Bbm3', 'NATEY', 'Bbm3', true),
('NATEY Am3', 'NATEY', 'Am3', true),
('NATEY G#m3', 'NATEY', 'G#m3', true),
('NATEY Gm3', 'NATEY', 'Gm3', true);

-- DOUBLE MAPPINGS FOR DIFFERENT KEYS
INSERT INTO mold_mappings (name, instrument_type, tuning_note, is_active) VALUES
('DOUBLE C#m4', 'DOUBLE', 'C#m4', true),
('DOUBLE Cm4', 'DOUBLE', 'Cm4', true),
('DOUBLE Bm3', 'DOUBLE', 'Bm3', true),
('DOUBLE Bbm3', 'DOUBLE', 'Bbm3', true),
('DOUBLE Am3', 'DOUBLE', 'Am3', true),
('DOUBLE G#m3', 'DOUBLE', 'G#m3', true),
('DOUBLE Gm3', 'DOUBLE', 'Gm3', true);

-- ZEN MAPPINGS
INSERT INTO mold_mappings (name, instrument_type, tuning_note, is_active) VALUES
('ZEN_M Gm3', 'ZEN_M', 'Gm3', true),
('ZEN_L Em3', 'ZEN_L', 'Em3', true);

-- Now add molds to mappings (mold_mapping_items)

-- Helper function to add molds to mappings
DO $$
DECLARE
    mapping_rec RECORD;
    mold_rec RECORD;
    order_idx INTEGER;
BEGIN
    -- For each mapping, add all molds of the corresponding instrument type
    FOR mapping_rec IN SELECT id, instrument_type FROM mold_mappings LOOP
        order_idx := 0;
        
        FOR mold_rec IN SELECT id FROM mold_inventory 
                         WHERE instrument_type = mapping_rec.instrument_type 
                         ORDER BY name LOOP
                         
            -- Insert mapping item
            INSERT INTO mold_mapping_items (mapping_id, mold_id, order_index)
            VALUES (mapping_rec.id, mold_rec.id, order_idx);
            
            order_idx := order_idx + 1;
        END LOOP;
    END LOOP;
END $$;

-- Initialize flute settings with basic data
INSERT INTO flute_settings (instrument_type, tuning_note, frequency, description, adjusted_notes, is_active)
VALUES
-- INNATO settings
('INNATO', 'Cm4', 440, 'INNATO flute tuned to Cm4 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"LEFT","description":"Bb3 on left vessel needs to be raised slightly"},{"note":"D#4","cents":10,"vessel":"RIGHT","description":"Minor 3rd interval (D#4) needs to be raised by 10 cents"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),

('INNATO', 'D#m4', 440, 'INNATO flute tuned to D#m4 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"LEFT","description":"Bb3 on left vessel needs to be raised slightly"},{"note":"G4","cents":10,"vessel":"RIGHT","description":"Perfect 4th interval (G4) needs to be raised by 10 cents"},{"note":"G#4","cents":10,"vessel":"RIGHT","description":"Minor 3rd interval (G#4) needs to be raised by 10 cents"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),

-- Add remaining INNATO keys with basic adjustments
('INNATO', 'Dm4', 440, 'INNATO flute tuned to Dm4 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"LEFT","description":"Bb3 common adjustment across all Innato flutes"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),
 
('INNATO', 'C#m4', 440, 'INNATO flute tuned to C#m4 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"LEFT","description":"Bb3 common adjustment across all Innato flutes"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),

('INNATO', 'Em4', 440, 'INNATO flute tuned to Em4 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"LEFT","description":"Bb3 common adjustment across all Innato flutes"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),

-- NATEY basic settings
('NATEY', 'Am4', 440, 'NATEY flute tuned to Am4 at 440 Hz', 
 '{}', 
 true),

-- DOUBLE basic settings
('DOUBLE', 'C#m4', 440, 'DOUBLE flute tuned to C#m4 at 440 Hz', 
 '{}', 
 true),

-- ZEN basic settings
('ZEN_M', 'Gm3', 440, 'ZEN M flute tuned to Gm3 at 440 Hz', 
 '{"noteAdjustments":[{"note":"Bb3","cents":10,"vessel":"SINGLE","description":"Minor 3rd interval (Bb3) needs to be raised by 10 cents"},{"note":"C4","cents":10,"vessel":"SINGLE","description":"Perfect 4th interval (C4) needs to be raised by 10 cents"},{"note":"F4","cents":10,"vessel":"SINGLE","description":"Minor 7th interval (F4) needs to be raised by 10 cents"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true),

('ZEN_L', 'Em3', 440, 'ZEN L flute tuned to Em3 at 440 Hz', 
 '{"noteAdjustments":[{"note":"G3","cents":10,"vessel":"SINGLE","description":"Minor 3rd interval (G3) needs to be raised by 10 cents"},{"note":"A3","cents":10,"vessel":"SINGLE","description":"Perfect 4th interval (A3) needs to be raised by 10 cents"},{"note":"D4","cents":10,"vessel":"SINGLE","description":"Minor 7th interval (D4) needs to be raised by 10 cents"}],"intervalAdjustments":[{"interval":"minor3rd","cents":10,"description":"All minor 3rd intervals raised by 10 cents"},{"interval":"perfect4th","cents":10,"description":"All perfect 4th intervals raised by 10 cents"},{"interval":"minor7th","cents":10,"description":"All minor 7th intervals raised by 10 cents"}]}', 
 true);