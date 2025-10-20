-- Add some test orders
INSERT INTO orders (order_number, customer_name, customer_email, status, total_amount, notes) VALUES
('ORD-001', 'John Smith', 'john@example.com', 'pending', 150.00, 'First test order'),
('ORD-002', 'Jane Doe', 'jane@example.com', 'in_progress', 200.00, 'Second test order'),
('ORD-003', 'Bob Johnson', 'bob@example.com', 'completed', 175.50, 'Third test order');

-- Add some test order items
INSERT INTO order_items (order_id, serial_number, instrument_type, color_code, status, production_stage) VALUES
(1, 'SN001', 'flute', 'silver', 'ordered', 'ordered'),
(1, 'SN002', 'clarinet', 'black', 'ordered', 'ordered'),
(2, 'SN003', 'saxophone', 'gold', 'in_progress', 'building'),
(3, 'SN004', 'trumpet', 'brass', 'completed', 'completed');

-- Add some test materials
INSERT INTO materials_inventory (material_name, material_type, quantity_available, unit, supplier) VALUES
('Silver Wire', 'metal', 50.0, 'meters', 'Metal Supply Co'),
('Wood Block', 'wood', 25.0, 'pieces', 'Wood Works'),
('Brass Sheet', 'metal', 30.0, 'sheets', 'Brass Supply'),
('Cork', 'natural', 100.0, 'pieces', 'Natural Materials');

-- Add some test instruments
INSERT INTO instrument_inventory (instrument_name, instrument_type, serial_number, status, location) VALUES
('Flute Model A', 'flute', 'FL001', 'available', 'Workshop A'),
('Clarinet Model B', 'clarinet', 'CL001', 'in_use', 'Workshop B'),
('Saxophone Model C', 'saxophone', 'SAX001', 'available', 'Workshop C');


